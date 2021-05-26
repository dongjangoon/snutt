import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

export type CoursebookDocument = Coursebook & Document

@Schema()
export class Coursebook {
  @Prop({ type: Number })
  year: number
  @Prop({ type: Number })
  semester: number
  @Prop({ type: Date, default: null })
  updated_at?: Date
}

export const CoursebookSchema = SchemaFactory.createForClass(Coursebook)
