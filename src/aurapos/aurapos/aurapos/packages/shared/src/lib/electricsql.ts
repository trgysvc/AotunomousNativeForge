import { ElectricSQL } from '@electric-sql/client'
import { PGlite } from '@electric-sql/pglite'

const electric = new ElectricSQL({
  url: process.env.ELECTRIC_SERVICE_URL,
  token: process.env.ELECTRIC_TOKEN,
})

const db = new PGlite()

electric.sync(db).catch(console.error)

export const ordersShape = electric.shape('orders')
export const paymentsShape = electric.shape('payments')
export const stockShape = electric.shape('stock')