import { inject, injectable } from 'tsyringe'

import AppError from '@shared/errors/AppError'

import IProductsRepository from '@modules/products/repositories/IProductsRepository'
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository'
import Order from '../infra/typeorm/entities/Order'
import IOrdersRepository from '../repositories/IOrdersRepository'

interface IProduct {
  id: string
  quantity: number
}

interface IRequest {
  customer_id: string
  products: IProduct[]
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id)
    if (!customer) throw new AppError('Customer not found')

    const baseProducts = await this.productsRepository.findAllById(products)
    const isValidProducts = products.length === baseProducts.length

    if (!isValidProducts) throw new AppError('Invalid products')

    const items = baseProducts.map(({ id, quantity, price }) => {
      const product = products.find(item => item.id === id)
      const isProductAvailable = product && product.quantity < quantity
      if (!isProductAvailable) throw new AppError('Not enough products')

      return {
        product_id: id,
        quantity: product?.quantity || 1,
        price
      }
    })

    const order = await this.ordersRepository.create({
      customer,
      products: items
    })

    if (!order) throw new AppError('Order could not be created')

    await this.productsRepository.updateQuantity(products)

    return order
  }
}

export default CreateOrderService
