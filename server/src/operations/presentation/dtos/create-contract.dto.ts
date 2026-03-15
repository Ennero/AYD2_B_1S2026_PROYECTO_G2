export class CreateContractDto {
  clientId: string;
  creditLimit: number;
  paymentTermDays: number;
  discountPercentage: number;
  /** IDs de rutas a incluir en el contrato */
  routeIds: number[];
  /** IDs de tipos de mercancía permitidos */
  cargoTypeIds: number[];
}
