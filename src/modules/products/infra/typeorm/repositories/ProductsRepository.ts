import { getRepository, Repository, In } from 'typeorm'

import IProductsRepository from '@modules/products/repositories/IProductsRepository'
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO'
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO'
import Product from '../entities/Product'

interface IFindProducts {
  id: string
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>

  constructor() {
    this.ormRepository = getRepository(Product)
  }

  public async create({
    name,
    price,
    quantity
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity })

    await this.ormRepository.save(product)

    return product
  }

  public async findByName(name: string): Promise<Product | undefined> {
    return this.ormRepository.findOne({ where: { name } })
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id)
    return this.ormRepository.find({ where: { id: In(ids) } })
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[]
  ): Promise<Product[]> {
    const productList = await this.findAllById(products)

    productList.forEach(product => {
      const item = products.find(({ id }) => id === product.id)
      if (!item) return

      product.quantity -= item.quantity
    })

    return this.ormRepository.save(productList)
  }
}

export default ProductsRepository
