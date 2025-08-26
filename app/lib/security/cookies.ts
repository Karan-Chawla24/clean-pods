// Secure cookie configuration utilities
import { SECURITY_CONFIG } from './config';

// Cookie options interface
export interface SecureCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

// Default secure cookie options
export const getSecureCookieOptions = (overrides: Partial<SecureCookieOptions> = {}): SecureCookieOptions => {
  return {
    httpOnly: SECURITY_CONFIG.SESSION.HTTP_ONLY,
    secure: SECURITY_CONFIG.SESSION.SECURE,
    sameSite: SECURITY_CONFIG.SESSION.SAME_SITE,
    maxAge: SECURITY_CONFIG.SESSION.MAX_AGE,
    path: '/',
    ...overrides
  };
};

// Helper function to set secure cookies in API routes
export const setSecureCookie = (
  response: Response,
  name: string,
  value: string,
  options: Partial<SecureCookieOptions> = {}
): void => {
  const cookieOptions = getSecureCookieOptions(options);
  
  let cookieString = `${name}=${value}`;
  
  if (cookieOptions.httpOnly) {
    cookieString += '; HttpOnly';
  }
  
  if (cookieOptions.secure) {
    cookieString += '; Secure';
  }
  
  if (cookieOptions.sameSite) {
    cookieString += `; SameSite=${cookieOptions.sameSite}`;
  }
  
  if (cookieOptions.maxAge) {
    cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  }
  
  if (cookieOptions.path) {
    cookieString += `; Path=${cookieOptions.path}`;
  }
  
  if (cookieOptions.domain) {
    cookieString += `; Domain=${cookieOptions.domain}`;
  }
  
  response.headers.set('Set-Cookie', cookieString);
};

// Helper function to clear secure cookies
export const clearSecureCookie = (
  response: Response,
  name: string,
  options: Partial<SecureCookieOptions> = {}
): void => {
  setSecureCookie(response, name, '', {
    ...options,
    maxAge: 0
  });
};

// Validate cookie security attributes
export const validateCookieSecurity = (cookieString: string): boolean => {
  const requiredAttributes = ['HttpOnly', 'Secure', 'SameSite'];
  
  return requiredAttributes.every(attr => 
    cookieString.toLowerCase().includes(attr.toLowerCase())
  );
};

// Cookie security audit function
export const auditCookieSecurity = (cookies: string[]): {
  secure: string[];
  insecure: string[];
  warnings: string[];
} => {
  const result = {
    secure: [] as string[],
    insecure: [] as string[],
    warnings: [] as string[]
  };
  
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name] = nameValue.split('=');
    
    if (validateCookieSecurity(cookie)) {
      result.secure.push(name);
    } else {
      result.insecure.push(name);
      
      if (!cookie.toLowerCase().includes('httponly')) {
        result.warnings.push(`Cookie '${name}' missing HttpOnly attribute`);
      }
      
      if (!cookie.toLowerCase().includes('secure') && process.env.NODE_ENV === 'production') {
        result.warnings.push(`Cookie '${name}' missing Secure attribute in production`);
      }
      
      if (!cookie.toLowerCase().includes('samesite')) {
        result.warnings.push(`Cookie '${name}' missing SameSite attribute`);
      }
    }
  });
  
  return result;
};