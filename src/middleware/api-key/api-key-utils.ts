import jwt from 'jsonwebtoken'
import { InvalidApiKeyError } from './api-key.error'

interface ApiKeyPayload {
  string: string
  key_version: string
}

const apiKeyList: { [key: string]: ApiKeyPayload } = {
  ios: {
    string: 'ios',
    key_version: '0',
  },
  web: {
    string: 'web',
    key_version: '0',
  },
  android: {
    string: 'android',
    key_version: '0',
  },
  test: {
    string: 'test',
    key_version: '0',
  },
}

export function issueKey(apiObj: string, secretKey: string): string {
  return jwt.sign(apiObj, secretKey)
}

export function validateKey(
  apiKey: string | undefined,
  secretKey: string,
): string {
  if (!apiKey) {
    throw new InvalidApiKeyError()
  }

  try {
    const result = jwt.verify(apiKey, secretKey) as ApiKeyPayload
    if (
      apiKeyList[result.string] &&
      apiKeyList[result.key_version].key_version === result.key_version
    ) {
      return result.string
    }
  } catch (e) {
    throw new InvalidApiKeyError()
  }
  throw new InvalidApiKeyError()
}
