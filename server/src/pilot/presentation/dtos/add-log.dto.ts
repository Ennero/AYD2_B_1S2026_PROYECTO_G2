// add-log.dto.ts — versión sin class-validator
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

export class AddLogDto {
    eventType: RouteEventType;
    description: string;
    imageBase64?: string;
}