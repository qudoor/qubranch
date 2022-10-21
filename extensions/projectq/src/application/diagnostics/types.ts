export const ISourceMapSupportService = Symbol('ISourceMapSupportService');
export interface ISourceMapSupportService {
    register(): void;
    enable(): Promise<void>;
}
