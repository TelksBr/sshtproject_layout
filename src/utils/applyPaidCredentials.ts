import { CredentialsResponse } from '../types/sales';
import { checkUser } from './checkUserUtils';
import {
  getCredentialIdentifier,
  purchaseStorage,
  ValidationSource,
} from './purchaseStorageManager';

export async function applyPaidCredentials(
  response: CredentialsResponse,
  source: ValidationSource = 'sales',
  label?: string
): Promise<string> {
  const id = purchaseStorage.upsertFromSales(response, source, label);
  if (!id) return '';

  const credential = purchaseStorage.getCredentialById(id);
  const identifier = credential ? getCredentialIdentifier(credential) : '';
  if (!identifier) return id;

  try {
    const result = await checkUser(identifier);
    if (result.success && result.data) {
      purchaseStorage.updateValidation(id, {
        limit: result.data.limit,
        expiration_date: result.data.expiration_date,
        count_connections: result.data.count_connections,
        expiration_days: result.data.expiration_days,
        source: 'checkuser',
      });
    }
  } catch {
    // Mantém a validade vinda da venda se o CheckUser falhar
  }

  return id;
}
