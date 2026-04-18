// deliver-order.dto.ts — versión sin class-validator
export class DeliverOrderDto {
  receiverName: string;
  receiverSignatureBase64: string;
  deliveryEvidenceBase64: string[];
  deliveredAt?: string;
  notes?: string;
}
