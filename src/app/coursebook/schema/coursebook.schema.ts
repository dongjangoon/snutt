import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type CoursebookDocument = CoursebookEntity & Document

@Schema()
export class CoursebookEntity {
  @Prop({ type: Number })
  year: number
  @Prop({ type: Number })
  semester: number
  @Prop({ type: Date, default: null })
  updated_at?: Date
}

export const CoursebookSchema = SchemaFactory.createForClass(CoursebookEntity)
