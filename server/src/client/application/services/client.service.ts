import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, In, QueryFailedError } from 'typeorm';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { Invoice } from '../../../infrastructure/database/typeorm/entities/invoice.entity';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { ClientContact } from '../../../infrastructure/database/typeorm/entities/client-contact.entity';
import { ContractRoute } from '../../../infrastructure/database/typeorm/entities/contract-route.entity';
import { ContractRate } from '../../../infrastructure/database/typeorm/entities/contract-rate.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { Payment } from '../../../infrastructure/database/typeorm/entities/payment.entity';
import { CargoType } from '../../../infrastructure/database/typeorm/entities/cargo-type.entity';
import { Contract } from '../../../infrastructure/database/typeorm/entities/contract.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { AcceptContractDto, CreateContactDto, CreateOrderDto, RegisterPaymentDto, UpdateContactDto } from '../../presentation/dto/client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly dataSource: DataSource) {}

  // ── Helpers ────────────────────────────────────────────────────────────

  private async resolveClient(userId: number) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { userId },
      relations: ['client'],
    });
    if (!user?.client) throw new NotFoundException('Cliente no encontrado');
    return user.client;
  }

  // ── Catálogos ──────────────────────────────────────────────────────────

  async getCargoTypes() {
    return this.dataSource
      .getRepository(CargoType)
      .find({ order: { cargoName: 'ASC' } });
  }

  async getActiveContracts(userId: number) {
    const client = await this.resolveClient(userId);
    const contracts = await this.dataSource.getRepository(Contract).find({
      where: { clientId: client.clientId, status: ContractStatus.VIGENTE },
      order: { startDate: 'DESC' },
    });
    return contracts.map((c) => ({
      contractId: c.contractId,
      contractNumber: c.contractNumber,
      startDate: c.startDate,
      endDate: c.endDate,
      creditLimit: c.creditLimit !== null ? Number(c.creditLimit) : 0,
      paymentTermDays: c.paymentTermDays,
    }));
  }

  // ── Órdenes ────────────────────────────────────────────────────────────

  async createOrder(userId: number, dto: CreateOrderDto) {
    const client = await this.resolveClient(userId);

    // Verificar contrato vigente y que pertenezca al cliente
    const contract = await this.dataSource.getRepository(Contract).findOne({
      where: {
        contractId: dto.contractId,
        clientId: client.clientId,
        status: ContractStatus.VIGENTE,
      },
    });
    if (!contract) {
      throw new BadRequestException(
        'Contrato no encontrado o no está vigente para este cliente',
      );
    }

    // Verificar tipo de mercancía válido
    const cargoType = await this.dataSource
      .getRepository(CargoType)
      .findOne({ where: { cargoTypeId: dto.cargoTypeId } });
    if (!cargoType) {
      throw new BadRequestException('Tipo de mercancía no válido');
    }

    // Verificar que el cliente no está bloqueado
    if (client.isBlocked) {
      throw new BadRequestException(
        `No puedes crear órdenes: cuenta bloqueada. ${client.blockReason ?? ''}`.trim(),
      );
    }

    // Generar número de orden único
    const year = new Date().getFullYear();
    const count = await this.dataSource.getRepository(Order).count();
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(4, '0')}`;

    const order = this.dataSource.getRepository(Order).create({
      orderNumber,
      contractId: dto.contractId,
      requestedByUserId: userId,
      cargoTypeId: dto.cargoTypeId,
      status: OrderStatus.REGISTRADA,
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress,
      declaredWeightTon: dto.declaredWeightTon,
      cargoDescription: dto.cargoDescription ?? 'PENDIENTE_DETALLE',
      requestedAt: new Date(),
    });

    try {
      await this.dataSource.getRepository(Order).save(order);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        // Surface DB trigger business rule violations as 400 errors
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      declaredWeightTon: order.declaredWeightTon,
      cargoDescription: order.cargoDescription,
      requestedAt: order.requestedAt,
    };
  }

  async getOrders(
    userId: number,
    search?: string,
    status?: string,
    page = 1,
    limit = 10,
  ) {
    const client = await this.resolveClient(userId);

    // Resolve contract IDs for this client
    const contracts = await this.dataSource
      .getRepository(Contract)
      .find({ where: { clientId: client.clientId }, select: ['contractId'] });

    if (contracts.length === 0) {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const contractIds = contracts.map((c) => c.contractId);

    // Build where clause
    const where: Record<string, unknown> = { contractId: In(contractIds) };
    if (status) where['status'] = status;

    // Use findAndCount to avoid QueryBuilder getCount + leftJoinAndSelect issues
    const orderRepo = this.dataSource.getRepository(Order);

    if (search) {
      // Need QueryBuilder only when searching by order_number
      const [orders, total] = await orderRepo
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.cargoType', 'ct')
        .leftJoinAndSelect('o.unit', 'u')
        .leftJoinAndSelect('u.vehicleType', 'vt')
        .where('o.contract_id IN (:...ids)', { ids: contractIds })
        .andWhere('o.order_number ILIKE :s', { s: `%${search}%` })
        .andWhere(status ? 'o.status = :status' : '1=1', status ? { status } : {})
        .orderBy('o.requested_at', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return this.mapOrderPage(orders, total, page, limit);
    }

    const [orders, total] = await orderRepo.findAndCount({
      where,
      relations: ['cargoType', 'unit', 'unit.vehicleType'],
      order: { requestedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.mapOrderPage(orders, total, page, limit);
  }

  private mapOrderPage(orders: Order[], total: number, page: number, limit: number) {
    return {
      items: orders.map((o) => ({
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        status: o.status,
        cargoType: o.cargoType?.cargoName ?? null,
        pickupAddress: o.pickupAddress,
        deliveryAddress: o.deliveryAddress,
        origin: o.origin,
        destination: o.destination,
        declaredWeightTon: Number(o.declaredWeightTon),
        totalAmount: Number(o.totalAmount),
        requestedAt: o.requestedAt,
        scheduledPickupAt: o.scheduledPickupAt,
        promisedDeliveryAt: o.promisedDeliveryAt,
        dispatchedAt: o.dispatchedAt,
        deliveredAt: o.deliveredAt,
        unitPlate: o.unit?.plateNumber ?? null,
        vehicleType: o.unit?.vehicleType?.typeName ?? null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderTracking(userId: number, orderId: number) {
    const client = await this.resolveClient(userId);

    const order = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .innerJoin('o.contract', 'c')
      .leftJoinAndSelect('o.cargoType', 'ct')
      .leftJoinAndSelect('o.unit', 'u')
      .leftJoinAndSelect('u.vehicleType', 'vt')
      .where('o.order_id = :orderId', { orderId })
      .andWhere('c.client_id = :clientId', { clientId: client.clientId })
      .getOne();

    if (!order) throw new NotFoundException('Orden no encontrada');

    const logs = await this.dataSource
      .getRepository(OrderRouteLog)
      .find({
        where: { orderId },
        order: { eventTime: 'ASC' },
      });

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      cargoType: order.cargoType?.cargoName ?? null,
      cargoDescription: order.cargoDescription,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      origin: order.origin,
      destination: order.destination,
      declaredWeightTon: Number(order.declaredWeightTon),
      loadedWeightTon: order.loadedWeightTon ? Number(order.loadedWeightTon) : null,
      totalAmount: Number(order.totalAmount),
      requestedAt: order.requestedAt,
      scheduledPickupAt: order.scheduledPickupAt,
      promisedDeliveryAt: order.promisedDeliveryAt,
      dispatchedAt: order.dispatchedAt,
      deliveredAt: order.deliveredAt,
      receiverName: order.receiverName,
      stowageConfirmed: order.stowageConfirmed,
      isSealed: order.isSealed,
      unitPlate: order.unit?.plateNumber ?? null,
      vehicleType: order.unit?.vehicleType?.typeName ?? null,
      logs: logs.map((l) => ({
        logId: l.logId,
        eventType: l.eventType,
        eventTime: l.eventTime,
        description: l.description,
      })),
    };
  }

  // ── Facturas ───────────────────────────────────────────────────────────

  async getInvoices(
    userId: number,
    search?: string,
    page = 1,
    limit = 10,
  ) {
    const client = await this.resolveClient(userId);

    const qb = this.dataSource
      .getRepository(Invoice)
      .createQueryBuilder('i')
      .where('i.client_id = :clientId', { clientId: client.clientId })
      .orderBy('i.issue_date', 'DESC');

    if (search) {
      qb.andWhere('i.invoice_number ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Verificar cuáles facturas ya tienen un pago PENDIENTE
    const invoiceIds = items.map((i) => i.invoiceId);
    const pendingPayments = invoiceIds.length
      ? await this.dataSource
          .getRepository(Payment)
          .createQueryBuilder('p')
          .where('p.invoice_id IN (:...ids)', { ids: invoiceIds })
          .andWhere('p.status = :status', { status: PaymentStatus.PENDIENTE })
          .getMany()
      : [];
    const pendingSet = new Set(pendingPayments.map((p) => p.invoiceId));

    return {
      items: items.map((inv) => ({
        invoiceId: inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        serviceDescription: inv.serviceDescription,
        felUuid: inv.felUuid,
        subtotalAmount: Number(inv.subtotalAmount),
        taxAmount: Number(inv.taxAmount),
        totalAmount: Number(inv.totalAmount),
        status: inv.status,
        dueDate: inv.dueDate,
        issueDate: inv.issueDate,
        certifiedAt: inv.certifiedAt,
        sentAt: inv.sentAt,
        clientName: inv.clientName,
        clientNit: inv.clientNit,
        clientAddress: inv.clientAddress,
        pdfPath: inv.pdfPath,
        hasPendingPayment: pendingSet.has(inv.invoiceId),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Pagos ──────────────────────────────────────────────────────────────

  async registerPayment(userId: number, dto: RegisterPaymentDto) {
    const client = await this.resolveClient(userId);

    // Verificar que la factura pertenece al cliente y está pendiente de pago
    const invoice = await this.dataSource.getRepository(Invoice).findOne({
      where: { invoiceId: dto.invoiceId, clientId: client.clientId },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    if (invoice.status !== InvoiceStatus.ENVIADA) {
      throw new BadRequestException(
        'Solo se pueden registrar pagos en facturas con estado ENVIADA',
      );
    }

    // Bloquear si ya existe un pago PENDIENTE para esta factura
    const existingPending = await this.dataSource.getRepository(Payment).findOne({
      where: { invoiceId: dto.invoiceId, status: PaymentStatus.PENDIENTE },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Ya existe un pago pendiente de aprobación para esta factura. Espera a que el área financiera lo procese.',
      );
    }

    const payment = this.dataSource.getRepository(Payment).create({
      invoiceId: dto.invoiceId,
      method: dto.method as PaymentMethod,
      status: PaymentStatus.PENDIENTE,
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      bankReference: dto.bankReference,
      supportDocumentPath: dto.supportDocumentPath,
      amount: invoice.totalAmount,
      paymentDate: new Date(),
    });
    await this.dataSource.getRepository(Payment).save(payment);

    return {
      paymentId: payment.paymentId,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.totalAmount),
      method: payment.method,
      status: payment.status,
      message: 'Pago registrado. Quedará pendiente de aprobación por el área financiera.',
    };
  }

  async getProfile(userId: number) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { userId },
      relations: ['client'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
      },
      company: user.client
        ? {
            clientId: user.client.clientId,
            clientCode: user.client.clientCode,
            legalName: user.client.legalName,
            nit: user.client.nit,
            taxAddress: user.client.taxAddress,
            primaryContactName: user.client.primaryContactName,
            primaryContactEmail: user.client.primaryContactEmail,
            primaryContactPhone: user.client.primaryContactPhone,
            isBlocked: user.client.isBlocked,
            blockReason: user.client.blockReason,
          }
        : null,
    };
  }

  async updateProfile(userId: number, phone: string | undefined) {
    const repo = this.dataSource.getRepository(User);
    const user = await repo.findOne({ where: { userId } });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.phone = phone ?? user.phone;
    await repo.save(user);

    return {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    };
  }

  async getDashboardSummary(userId: number) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { userId },
      relations: ['client'],
    });

    if (!user || !user.client) throw new NotFoundException('Cliente no encontrado');

    const { client } = user;
    const activeContract = await this.dataSource.getRepository(Contract).findOne({
      where: { clientId: client.clientId, status: ContractStatus.VIGENTE },
    });
    const creditLimit = activeContract?.creditLimit != null ? Number(activeContract.creditLimit) : 0;

    // ── Órdenes activas (a través de contratos del cliente) ──────────────
    const activeStatuses = [
      OrderStatus.REGISTRADA,
      OrderStatus.ASIGNADA,
      OrderStatus.LISTA_PARA_DESPACHO,
      OrderStatus.EN_TRANSITO,
    ];

    const activeOrders = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .innerJoin('o.contract', 'c')
      .where('c.client_id = :clientId', { clientId: client.clientId })
      .andWhere('o.status IN (:...statuses)', { statuses: activeStatuses })
      .orderBy('o.requested_at', 'DESC')
      .getMany();

    const recentOrders = activeOrders.slice(0, 3).map((o) => ({
      orderId: o.orderId,
      orderNumber: o.orderNumber,
      destination: o.destination ?? o.deliveryAddress,
      status: o.status,
      requestedAt: o.requestedAt,
    }));

    // ── Crédito (facturas ENVIADA pendientes de pago) ────────────────────
    const unpaidInvoices = await this.dataSource
      .getRepository(Invoice)
      .find({ where: { clientId: client.clientId, status: InvoiceStatus.ENVIADA } });

    const totalOwed = unpaidInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // ── Alertas: facturas ENVIADA vencidas ───────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueInvoices = unpaidInvoices.filter((inv) => inv.dueDate < todayStr);

    const alerts = overdueInvoices.map((inv) => ({
      type: 'INVOICE_PENDING' as const,
      invoiceNumber: inv.invoiceNumber,
      message: `La factura ${inv.invoiceNumber} requiere pago para liberar crédito.`,
      dueDate: inv.dueDate,
      amount: Number(inv.totalAmount),
    }));

    return {
      clientName: client.legalName,
      isBlocked: client.isBlocked,
      creditLimit,
      totalOwed,
      availableCredit: creditLimit - totalOwed,
      activeOrdersCount: activeOrders.length,
      recentOrders,
      alerts,
    };
  }

  async getAccountStatement(userId: number) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { userId },
      relations: ['client'],
    });

    if (!user || !user.client) throw new NotFoundException('Cliente no encontrado');

    const { client } = user;
    const activeContract = await this.dataSource.getRepository(Contract).findOne({
      where: { clientId: client.clientId, status: ContractStatus.VIGENTE },
    });
    const creditLimit = activeContract?.creditLimit != null ? Number(activeContract.creditLimit) : 0;

    // Facturas pendientes de pago (enviadas al cliente, no pagadas aún)
    const unpaidInvoices = await this.dataSource
      .getRepository(Invoice)
      .find({ where: { clientId: client.clientId, status: InvoiceStatus.ENVIADA } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold30 = new Date(today);
    threshold30.setDate(today.getDate() - 30);

    let current = 0;
    let overdue30 = 0;
    let critical = 0;

    for (const inv of unpaidInvoices) {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const amount = Number(inv.totalAmount);

      if (dueDate >= today) {
        current += amount;
      } else if (dueDate >= threshold30) {
        overdue30 += amount;
      } else {
        critical += amount;
      }
    }

    const totalOwed = current + overdue30 + critical;

    return {
      creditLimit,
      totalOwed,
      availableCredit: creditLimit - totalOwed,
      aging: { current, overdue30, critical },
    };
  }

  // ── Contratos (vista cliente) ──────────────────────────────────────────

  async getAllContracts(userId: number) {
    const client = await this.resolveClient(userId);
    const contracts = await this.dataSource.getRepository(Contract).find({
      where: { clientId: client.clientId },
      order: { startDate: 'DESC' },
    });
    return contracts.map((c) => ({
      contractId: c.contractId,
      contractNumber: c.contractNumber,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      acceptedAt: c.acceptedAt,
      creditLimit: c.creditLimit !== null ? Number(c.creditLimit) : null,
      paymentTermDays: c.paymentTermDays,
      discountPercentage: Number(c.discountPercentage),
      notes: c.notes,
    }));
  }

  async getContractDetail(userId: number, contractId: number) {
    const client = await this.resolveClient(userId);

    const contract = await this.dataSource.getRepository(Contract).findOne({
      where: { contractId, clientId: client.clientId },
      relations: ['cargoTypes'],
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const contractRoutes = await this.dataSource
      .getRepository(ContractRoute)
      .find({
        where: { contractId },
        relations: ['route'],
      });

    const contractRates = await this.dataSource
      .getRepository(ContractRate)
      .find({
        where: { contractId },
        relations: ['vehicleType'],
      });

    return {
      contractId: contract.contractId,
      contractNumber: contract.contractNumber,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      acceptedAt: contract.acceptedAt,
      creditLimit: contract.creditLimit !== null ? Number(contract.creditLimit) : null,
      paymentTermDays: contract.paymentTermDays,
      discountPercentage: Number(contract.discountPercentage),
      notes: contract.notes,
      cargoTypes: contract.cargoTypes.map((ct) => ({
        cargoTypeId: ct.cargoTypeId,
        cargoName: ct.cargoName,
        requiresRefrigeration: ct.requiresRefrigeration,
      })),
      routes: contractRoutes.map((cr) => ({
        contractRouteId: cr.contractRouteId,
        promisedDeliveryHours: Number(cr.promisedDeliveryHours),
        route: {
          routeCode: cr.route.routeCode,
          origin: cr.route.origin,
          destination: cr.route.destination,
          distanceKm: Number(cr.route.distanceKm),
          isInternational: cr.route.isInternational,
        },
      })),
      rates: contractRates.map((r) => ({
        contractRateId: r.contractRateId,
        baseRatePerKm: Number(r.baseRatePerKm),
        discountPercentage: Number(r.discountPercentage),
        finalRatePerKm: Number(r.finalRatePerKm),
        vehicleType: {
          typeCode: r.vehicleType.typeCode,
          typeName: r.vehicleType.typeName,
          minCapacityTon: Number(r.vehicleType.minCapacityTon),
          maxCapacityTon: r.vehicleType.maxCapacityTon ? Number(r.vehicleType.maxCapacityTon) : null,
        },
      })),
    };
  }

  async acceptContract(userId: number, contractId: number, dto: AcceptContractDto) {
    const client = await this.resolveClient(userId);
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Contract);

      const contract = await repo.findOne({
        where: { contractId, clientId: client.clientId },
      });
      if (!contract) throw new NotFoundException('Contrato no encontrado');
      if (contract.status !== ContractStatus.PENDIENTE) {
        throw new BadRequestException(
          'Solo se pueden aceptar contratos con estado PENDIENTE',
        );
      }

      await repo
        .createQueryBuilder()
        .update(Contract)
        .set({ status: ContractStatus.VENCIDO })
        .where('client_id = :clientId', { clientId: client.clientId })
        .andWhere('status = :status', { status: ContractStatus.VIGENTE })
        .andWhere('contract_id <> :contractId', { contractId })
        .execute();

      contract.creditLimit = dto.creditLimit;
      contract.status = ContractStatus.VIGENTE;
      contract.acceptedAt = new Date();
      await repo.save(contract);

      return {
        contractId: contract.contractId,
        contractNumber: contract.contractNumber,
        status: contract.status,
        acceptedAt: contract.acceptedAt,
        creditLimit: Number(contract.creditLimit),
      };
    });
  }

  async rejectContract(userId: number, contractId: number) {
    const client = await this.resolveClient(userId);
    const repo = this.dataSource.getRepository(Contract);

    const contract = await repo.findOne({
      where: { contractId, clientId: client.clientId },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    if (contract.status !== ContractStatus.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden rechazar contratos con estado PENDIENTE',
      );
    }

    contract.status = ContractStatus.RECHAZADO;
    await repo.save(contract);

    return {
      contractId: contract.contractId,
      contractNumber: contract.contractNumber,
      status: contract.status,
    };
  }

  // ── Contactos ──────────────────────────────────────────────────────────

  async getContacts(userId: number) {
    const client = await this.resolveClient(userId);
    const contacts = await this.dataSource
      .getRepository(ClientContact)
      .find({
        where: { clientId: client.clientId, isActive: true },
        order: { contactName: 'ASC' },
      });
    return contacts.map((c) => ({
      contactId: c.contactId,
      contactName: c.contactName,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      positionTitle: c.positionTitle,
    }));
  }

  async createContact(userId: number, dto: CreateContactDto) {
    const client = await this.resolveClient(userId);
    const repo = this.dataSource.getRepository(ClientContact);

    const existing = await repo.findOne({
      where: { clientId: client.clientId, contactEmail: dto.contactEmail, isActive: true },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe un contacto con el correo "${dto.contactEmail}"`,
      );
    }

    const contact = repo.create({
      clientId: client.clientId,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone ?? null,
      positionTitle: dto.positionTitle ?? null,
      isActive: true,
    });
    await repo.save(contact);

    return {
      contactId: contact.contactId,
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhone: contact.contactPhone,
      positionTitle: contact.positionTitle,
    };
  }

  async updateContact(userId: number, contactId: number, dto: UpdateContactDto) {
    const client = await this.resolveClient(userId);
    const repo = this.dataSource.getRepository(ClientContact);

    const contact = await repo.findOne({
      where: { contactId, clientId: client.clientId, isActive: true },
    });
    if (!contact) throw new NotFoundException('Contacto no encontrado');

    if (dto.contactEmail && dto.contactEmail !== contact.contactEmail) {
      const duplicate = await repo.findOne({
        where: { clientId: client.clientId, contactEmail: dto.contactEmail, isActive: true },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Ya existe un contacto con el correo "${dto.contactEmail}"`,
        );
      }
    }

    if (dto.contactName !== undefined) contact.contactName = dto.contactName;
    if (dto.contactEmail !== undefined) contact.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) contact.contactPhone = dto.contactPhone ?? null;
    if (dto.positionTitle !== undefined) contact.positionTitle = dto.positionTitle ?? null;

    await repo.save(contact);

    return {
      contactId: contact.contactId,
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhone: contact.contactPhone,
      positionTitle: contact.positionTitle,
    };
  }

  async removeContact(userId: number, contactId: number) {
    const client = await this.resolveClient(userId);
    const repo = this.dataSource.getRepository(ClientContact);

    const contact = await repo.findOne({
      where: { contactId, clientId: client.clientId, isActive: true },
    });
    if (!contact) throw new NotFoundException('Contacto no encontrado');

    contact.isActive = false;
    await repo.save(contact);
    return { message: 'Contacto eliminado correctamente' };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const repo = this.dataSource.getRepository(User);
    const user = await repo.findOne({ where: { userId } });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await repo.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
