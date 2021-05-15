import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cat, CatDocument } from '../../schemas/cat.schema'
import { Model } from 'mongoose'

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<CatDocument>) {}

  async create(createCatDto: {
    name: string
    age: number
    breed: string
  }): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto)
    return createdCat.save()
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec()
  }
}
