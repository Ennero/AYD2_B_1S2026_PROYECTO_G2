import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * EventsGateway — Real-time async dashboard updates via WebSocket.
 *
 * Clients connect to ws://host/events and receive domain events pushed
 * from the RabbitMQ consumer whenever the system state changes:
 *
 *   Event                  | Trigger
 *   ---------------------- | ----------------------------------------------
 *   factura.borrador       | New draft invoice created (order delivered)
 *   factura.certificada    | FEL certifier approved the invoice
 *   factura.rechazada      | FEL certifier rejected the invoice
 *   factura.en_espera      | FEL service unavailable — invoice queued
 *   orden.entregada        | Pilot confirmed order delivery
 *   pago.aprobado          | Finance agent approved a payment
 *   dashboard.refresh      | Generic signal for all dashboards to reload data
 *
 * Frontend integration (Next.js):
 *   import { io } from 'socket.io-client';
 *   const socket = io('http://localhost:3006/events');
 *   socket.on('factura.certificada', (data) => queryClient.invalidateQueries(['invoices']));
 */
@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized at /events');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Broadcast helpers (called by RabbitmqConsumerController) ─────────────

  emitFacturaBorrador(data: unknown) {
    this.server.emit('factura.borrador', data);
    this.server.emit('dashboard.refresh', { scope: 'certifier' });
  }

  emitFacturaCertificada(data: unknown) {
    this.server.emit('factura.certificada', data);
    this.server.emit('dashboard.refresh', { scope: 'finance' });
    this.server.emit('dashboard.refresh', { scope: 'gerencia' });
  }

  emitFacturaRechazada(data: unknown) {
    this.server.emit('factura.rechazada', data);
    this.server.emit('dashboard.refresh', { scope: 'certifier' });
  }

  emitFacturaEnEspera(data: unknown) {
    this.server.emit('factura.en_espera', data);
    this.server.emit('dashboard.refresh', { scope: 'certifier' });
  }

  emitOrdenEntregada(data: unknown) {
    this.server.emit('orden.entregada', data);
    this.server.emit('dashboard.refresh', { scope: 'logistics' });
    this.server.emit('dashboard.refresh', { scope: 'gerencia' });
  }

  emitPagoAprobado(data: unknown) {
    this.server.emit('pago.aprobado', data);
    this.server.emit('dashboard.refresh', { scope: 'finance' });
    this.server.emit('dashboard.refresh', { scope: 'gerencia' });
    this.server.emit('dashboard.refresh', { scope: 'client' });
  }
}
