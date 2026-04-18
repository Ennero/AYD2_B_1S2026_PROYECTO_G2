import { Type } from 'class-transformer';

export class AssignOrderDto {
  @Type(() => Number)
  contractRouteId: number;

  binomialId: string;
  scheduledDeparture: string;
}
