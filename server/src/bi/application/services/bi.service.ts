import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BiService {
  constructor(private readonly dataSource: DataSource) {}

  async getKpis(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;

    const dateFilter = isMonthly
      ? `EXTRACT(YEAR FROM o.requested_at) = ${year} AND EXTRACT(MONTH FROM o.requested_at) = ${month}`
      : `EXTRACT(YEAR FROM o.requested_at) = ${year}`;

    const invoiceDateFilter = isMonthly
      ? `EXTRACT(YEAR FROM i.issue_date) = ${year} AND EXTRACT(MONTH FROM i.issue_date) = ${month}`
      : `EXTRACT(YEAR FROM i.issue_date) = ${year}`;

    const [completedRow] = await this.dataSource.query<{ count: string }[]>(`
      SELECT COUNT(*) AS count FROM orders o
      WHERE o.status = 'ENTREGADA' AND ${dateFilter}
    `);

    const [billingRow] = await this.dataSource.query<{ total: string }[]>(`
      SELECT
        COALESCE(
          ROUND(
            SUM(i.total_amount / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric,
            2
          ),
          0
        ) AS total
      FROM invoices i
      WHERE ${invoiceDateFilter}
    `);

    const [incidentsRow] = await this.dataSource.query<{ count: string }[]>(`
      SELECT COUNT(DISTINCT orl.order_id) AS count
      FROM order_route_logs orl
      JOIN orders o ON o.order_id = orl.order_id
      WHERE orl.event_type = 'INCIDENTE'
        AND o.status NOT IN ('ENTREGADA', 'CANCELADA')
    `);

    return {
      completedServices: parseInt(completedRow.count, 10),
      billingAmount: parseFloat(billingRow.total),
      activeIncidents: parseInt(incidentsRow.count, 10),
    };
  }

  async getBranchesDistribution(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;

    const dateFilter = isMonthly
      ? `AND EXTRACT(YEAR FROM o.requested_at) = ${year} AND EXTRACT(MONTH FROM o.requested_at) = ${month}`
      : `AND EXTRACT(YEAR FROM o.requested_at) = ${year}`;

    const rows = await this.dataSource.query<
      { branch_id: number; branch_name: string; total_orders: string }[]
    >(`
      SELECT
        b.branch_id,
        b.branch_name,
        COUNT(o.order_id) AS total_orders
      FROM branches b
      LEFT JOIN transport_units tu ON tu.branch_id = b.branch_id
      LEFT JOIN orders o ON o.unit_id = tu.unit_id ${dateFilter}
      GROUP BY b.branch_id, b.branch_name
      ORDER BY total_orders DESC
    `);

    return rows.map((r) => ({
      branchId: r.branch_id,
      branchName: r.branch_name,
      totalOrders: parseInt(r.total_orders, 10),
    }));
  }

  async getRecentOrders(limit: number) {
    const rows = await this.dataSource.query<
      {
        order_number: string;
        client_name: string;
        origin: string;
        destination: string;
        status: string;
        requested_at: string;
      }[]
    >(`
      SELECT
        o.order_number,
        c.legal_name AS client_name,
        r.origin          AS origin,
        r.destination     AS destination,
        o.status,
        o.requested_at
      FROM orders o
      JOIN contracts ct ON ct.contract_id = o.contract_id
      JOIN clients c ON c.client_id = ct.client_id
      LEFT JOIN contract_routes cr ON cr.contract_route_id = o.contract_route_id
      LEFT JOIN routes r ON r.route_id = cr.route_id
      ORDER BY o.requested_at DESC
      LIMIT ${limit}
    `);

    return rows.map((r) => ({
      orderNumber: r.order_number,
      clientName: r.client_name,
      route:
        r.origin && r.destination
          ? `${r.origin} → ${r.destination}`
          : 'Sin ruta asignada',
      status: r.status,
      requestedAt: r.requested_at,
    }));
  }

  async getProfitability(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;
    const invoiceDateFilter = isMonthly
      ? `EXTRACT(YEAR FROM i.issue_date) = ${year} AND EXTRACT(MONTH FROM i.issue_date) = ${month}`
      : `EXTRACT(YEAR FROM i.issue_date) = ${year}`;

    // Revenue per client
    const revenueByClient = await this.dataSource.query<
      { client_name: string; ingresos: string; rentabilidad: string }[]
    >(`
      SELECT
        i.client_name,
        ROUND(
          SUM(i.total_amount / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric,
          2
        ) AS ingresos,
        ROUND(
          SUM(
            (i.total_amount - (COALESCE(o.fuel_cost, 0) + COALESCE(o.viatics_cost, 0) + COALESCE(o.maintenance_cost, 0)))
            / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1)
          )::numeric,
          2
        ) AS rentabilidad
      FROM invoices i
      JOIN orders o ON o.order_id = i.order_id
      WHERE ${invoiceDateFilter}
      GROUP BY i.client_name
      ORDER BY rentabilidad DESC
      LIMIT 8
    `);

    // Delivery compliance (% on time)
    const orderDateFilter = isMonthly
      ? `AND EXTRACT(YEAR FROM o.delivered_at) = ${year} AND EXTRACT(MONTH FROM o.delivered_at) = ${month}`
      : `AND EXTRACT(YEAR FROM o.delivered_at) = ${year}`;

    const [complianceRow] = await this.dataSource.query<
      { on_time: string; total: string; avg_delay_hrs: string }[]
    >(`
      SELECT
        COUNT(*) FILTER (WHERE o.delivered_at <= o.promised_delivery_at) AS on_time,
        COUNT(*)                                                          AS total,
        ROUND(
          AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.promised_delivery_at)) / 3600)::numeric,
          1
        ) AS avg_delay_hrs
      FROM orders o
      WHERE o.status = 'ENTREGADA'
        AND o.delivered_at IS NOT NULL
        AND o.promised_delivery_at IS NOT NULL
        ${orderDateFilter}
    `);

    // Real vs Promesa per order (last 10 delivered)
    const deliveryTimes = await this.dataSource.query<
      { order_number: string; prometido_hrs: string; real_hrs: string }[]
    >(`
      SELECT
        o.order_number,
        ROUND(EXTRACT(EPOCH FROM (o.promised_delivery_at - o.scheduled_pickup_at)) / 3600::numeric, 1) AS prometido_hrs,
        ROUND(EXTRACT(EPOCH FROM (o.delivered_at - o.dispatched_at)) / 3600::numeric, 1)              AS real_hrs
      FROM orders o
      WHERE o.status = 'ENTREGADA'
        AND o.delivered_at IS NOT NULL
        AND o.dispatched_at IS NOT NULL
        AND o.promised_delivery_at IS NOT NULL
        AND o.scheduled_pickup_at IS NOT NULL
      ORDER BY o.delivered_at DESC
      LIMIT 10
    `);

    const onTime = parseInt(complianceRow?.on_time ?? '0', 10);
    const total = parseInt(complianceRow?.total ?? '0', 10);
    const compliancePct = total > 0 ? Math.round((onTime / total) * 100) : 0;

    return {
      revenueByClient: revenueByClient.map((r) => ({
        clientName: r.client_name,
        ingresos: parseFloat(r.ingresos),
        rentabilidad: parseFloat(r.rentabilidad),
      })),
      compliance: {
        onTimePct: compliancePct,
        onTime,
        total,
        avgDelayHrs: parseFloat(complianceRow?.avg_delay_hrs ?? '0'),
      },
      deliveryTimes: deliveryTimes.map((r) => ({
        orderNumber: r.order_number,
        prometidoHrs: parseFloat(r.prometido_hrs),
        realHrs: parseFloat(r.real_hrs),
      })),
    };
  }

  async getGastosIngresos(year: number) {
    const rows = await this.dataSource.query<
      { mes: string; ingresos: string; gastos: string }[]
    >(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', i.issue_date), 'YYYY-MM') AS mes,
        ROUND(
          SUM(i.total_amount / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric,
          2
        ) AS ingresos,
        ROUND(
          SUM(
            (COALESCE(o.fuel_cost, 0) + COALESCE(o.viatics_cost, 0) + COALESCE(o.maintenance_cost, 0))
            / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1)
          )::numeric,
          2
        ) AS gastos
      FROM invoices i
      JOIN orders o ON o.order_id = i.order_id
      WHERE EXTRACT(YEAR FROM i.issue_date) = ${year}
      GROUP BY mes
      ORDER BY mes
    `);

    return rows.map((r) => ({
      mes: r.mes,
      ingresos: parseFloat(r.ingresos),
      gastos: parseFloat(r.gastos),
    }));
  }

  async getOrdersByStatus(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;
    const dateFilter = isMonthly
      ? `EXTRACT(YEAR FROM requested_at) = ${year} AND EXTRACT(MONTH FROM requested_at) = ${month}`
      : `EXTRACT(YEAR FROM requested_at) = ${year}`;

    const rows = await this.dataSource.query<
      { status: string; total: string }[]
    >(`
      SELECT status, COUNT(*) AS total
      FROM orders
      WHERE ${dateFilter}
      GROUP BY status
      ORDER BY total DESC
    `);

    return rows.map((r) => ({
      status: r.status,
      total: parseInt(r.total, 10),
    }));
  }

  async getDesgloseCostos(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;
    const dateFilter = isMonthly
      ? `EXTRACT(YEAR FROM i.issue_date) = ${year} AND EXTRACT(MONTH FROM i.issue_date) = ${month}`
      : `EXTRACT(YEAR FROM i.issue_date) = ${year}`;

    const [row] = await this.dataSource.query<
      { combustible: string; viaticos: string; mantenimiento: string }[]
    >(`
      SELECT
        ROUND(SUM(COALESCE(o.fuel_cost, 0) / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric, 2) AS combustible,
        ROUND(SUM(COALESCE(o.viatics_cost, 0) / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric, 2) AS viaticos,
        ROUND(SUM(COALESCE(o.maintenance_cost, 0) / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric, 2) AS mantenimiento
      FROM invoices i
      JOIN orders o ON o.order_id = i.order_id
      WHERE ${dateFilter}
    `);

    return {
      combustible: parseFloat(row?.combustible ?? '0'),
      viaticos: parseFloat(row?.viaticos ?? '0'),
      mantenimiento: parseFloat(row?.mantenimiento ?? '0'),
    };
  }

  async getBranchProfitability(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;
    const dateFilter = isMonthly
      ? `EXTRACT(YEAR FROM i.issue_date) = ${year} AND EXTRACT(MONTH FROM i.issue_date) = ${month}`
      : `EXTRACT(YEAR FROM i.issue_date) = ${year}`;

    const rows = await this.dataSource.query<
      { branch_name: string; ingresos: string; gastos: string }[]
    >(`
      SELECT
        b.branch_name,
        ROUND(
          SUM(i.total_amount / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1))::numeric,
          2
        ) AS ingresos,
        ROUND(
          SUM(
            (COALESCE(o.fuel_cost, 0) + COALESCE(o.viatics_cost, 0) + COALESCE(o.maintenance_cost, 0))
            / COALESCE(NULLIF(i.exchange_rate_from_usd, 0), 1)
          )::numeric,
          2
        ) AS gastos
      FROM branches b
      JOIN transport_units tu ON tu.branch_id = b.branch_id
      JOIN orders o ON o.unit_id = tu.unit_id
      JOIN invoices i ON i.order_id = o.order_id
      WHERE ${dateFilter}
      GROUP BY b.branch_name
      ORDER BY ingresos DESC
    `);

    return rows.map((r) => ({
      branchName: r.branch_name,
      ingresos: parseFloat(r.ingresos),
      gastos: parseFloat(r.gastos),
      margen: parseFloat(r.ingresos) - parseFloat(r.gastos),
    }));
  }

  async getTopRoutes(period: string, year: number, month?: number) {
    const isMonthly = period === 'MONTHLY' && month != null;
    const dateFilter = isMonthly
      ? `AND EXTRACT(YEAR FROM o.requested_at) = ${year} AND EXTRACT(MONTH FROM o.requested_at) = ${month}`
      : `AND EXTRACT(YEAR FROM o.requested_at) = ${year}`;

    const rows = await this.dataSource.query<
      { ruta: string; total: string }[]
    >(`
      SELECT
        r.origin || ' → ' || r.destination AS ruta,
        COUNT(o.order_id) AS total
      FROM orders o
      JOIN contract_routes cr ON cr.contract_route_id = o.contract_route_id
      JOIN routes r ON r.route_id = cr.route_id
      WHERE 1=1 ${dateFilter}
      GROUP BY ruta
      ORDER BY total DESC
      LIMIT 8
    `);

    return rows.map((r) => ({
      ruta: r.ruta,
      total: parseInt(r.total, 10),
    }));
  }

  async getAlerts() {
    // Active incidents
    const incidents = await this.dataSource.query<
      {
        description: string;
        order_number: string;
        origin: string;
        destination: string;
        event_time: string;
      }[]
    >(`
      SELECT
        orl.description,
        o.order_number,
        r.origin,
        r.destination,
        orl.event_time
      FROM order_route_logs orl
      JOIN orders o ON o.order_id = orl.order_id
      LEFT JOIN contract_routes cr ON cr.contract_route_id = o.contract_route_id
      LEFT JOIN routes r ON r.route_id = cr.route_id
      WHERE orl.event_type = 'INCIDENTE'
        AND o.status NOT IN ('ENTREGADA', 'CANCELADA')
      ORDER BY orl.event_time DESC
    `);

    // Orders in transit past promised delivery (late)
    const lateOrders = await this.dataSource.query<
      {
        order_number: string;
        delay_hrs: string;
        origin: string;
        destination: string;
      }[]
    >(`
      SELECT
        o.order_number,
        ROUND(EXTRACT(EPOCH FROM (NOW() - o.promised_delivery_at)) / 3600::numeric, 1) AS delay_hrs,
        r.origin,
        r.destination
      FROM orders o
      LEFT JOIN contract_routes cr ON cr.contract_route_id = o.contract_route_id
      LEFT JOIN routes r ON r.route_id = cr.route_id
      WHERE o.status = 'EN_TRANSITO'
        AND o.promised_delivery_at IS NOT NULL
        AND o.promised_delivery_at < NOW()
      ORDER BY delay_hrs DESC
      LIMIT 5
    `);

    // Monthly trend + projection (last 6 months + next 3 projected)
    const trend = await this.dataSource.query<
      { mes: string; ordenes: string }[]
    >(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', requested_at), 'YYYY-MM') AS mes,
        COUNT(*) AS ordenes
      FROM orders
      GROUP BY mes
      ORDER BY mes
    `);

    // Capacity stats
    const [capacity] = await this.dataSource.query<
      { units: string; pilots: string }[]
    >(`
      SELECT
        (SELECT COUNT(*) FROM transport_units WHERE is_active = true)  AS units,
        (SELECT COUNT(*) FROM users WHERE role = 'PILOTO' AND is_active = true) AS pilots
    `);

    return {
      incidents: incidents.map((r) => ({
        description: r.description,
        orderNumber: r.order_number,
        route:
          r.origin && r.destination
            ? `${r.origin} → ${r.destination}`
            : 'Sin ruta',
        eventTime: r.event_time,
      })),
      lateOrders: lateOrders.map((r) => ({
        orderNumber: r.order_number,
        delayHrs: parseFloat(r.delay_hrs),
        route:
          r.origin && r.destination
            ? `${r.origin} → ${r.destination}`
            : 'Sin ruta',
      })),
      trend: trend.map((r) => ({
        mes: r.mes,
        ordenes: parseInt(r.ordenes, 10),
      })),
      capacity: {
        currentUnits: parseInt(capacity?.units ?? '0', 10),
        currentPilots: parseInt(capacity?.pilots ?? '0', 10),
      },
    };
  }
}
