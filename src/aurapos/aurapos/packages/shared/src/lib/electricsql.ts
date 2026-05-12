import { ElectricSQL } from '@electric-sql/pglite';
import { electricConfig } from '@aurapos/electric-config';

const electric = new ElectricSQL(electricConfig);

export const orders = electric.shape('orders');
export const payments = electric.shape('payments');
export const stock = electric.shape('stock');

export default electric;