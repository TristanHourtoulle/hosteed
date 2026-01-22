import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo'
import { emailConfig } from '@/lib/config/email.config'

let clientInstance: TransactionalEmailsApi | null = null

export function getBrevoClient(): TransactionalEmailsApi {
  if (!clientInstance) {
    clientInstance = new TransactionalEmailsApi()
    clientInstance.setApiKey(
      TransactionalEmailsApiApiKeys.apiKey,
      emailConfig.apiKey
    )
  }
  return clientInstance
}

// For testing purposes - allows resetting the client
export function resetBrevoClient(): void {
  clientInstance = null
}
