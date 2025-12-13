import { base44 } from './base44Client';

// Provide safe wrappers for integration functions. If the migration shim
// implements them (e.g., UploadFile), they'll be available. Otherwise the
// exported function will throw a clear error so callers can be updated.

const Core = base44?.integrations?.Core || {};

export const CoreIntegration = Core;

const notImpl = (name) => async () => { throw new Error(`Integration ${name} is not implemented in the migration shim`); };

export const InvokeLLM = Core.InvokeLLM || notImpl('InvokeLLM');
export const SendEmail = Core.SendEmail || notImpl('SendEmail');
export const UploadFile = Core.UploadFile || notImpl('UploadFile');
export const GenerateImage = Core.GenerateImage || notImpl('GenerateImage');
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile || notImpl('ExtractDataFromUploadedFile');
export const CreateFileSignedUrl = Core.CreateFileSignedUrl || notImpl('CreateFileSignedUrl');
export const UploadPrivateFile = Core.UploadPrivateFile || notImpl('UploadPrivateFile');










