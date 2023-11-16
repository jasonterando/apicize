import { TestRequest } from '../models/test-request';
/**
 * Interface for all authentication providers
 */
export interface AuthorizationProvider {
    Setup(request: TestRequest): Promise<void>;
}