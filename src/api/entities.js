import {
	list,
	get,
	create,
	update,
	remove,
	query
} from '@/api/supabaseClient';

const handleResult = async (promise, mode = 'list') => {
	try {
		const res = await promise;
		if (res && res.error) {
			const err = res.error;
			console.error(`[entities] supabase error (${mode}):`, err.message ?? err, err.hint ? { hint: err.hint } : null);
			if (mode === 'list' || mode === 'filter') return [];
			return null;
		}
		// normalize return shapes
		if (mode === 'get') return res?.data ?? null;
		return res?.data ?? [];
	} catch (err) {
		console.error('[entities] unexpected error:', err);
		return mode === 'get' ? null : [];
	}
};

const makeEntity = (table) => ({
	list: (opts) => handleResult(list(table, opts), 'list'),
	get: (id, opts) => handleResult(get(table, id, opts), 'get'),
	// filter supports either object { key: value } or array of filter descriptors
	filter: (filters, opts = {}) => {
		if (!filters) return handleResult(list(table, opts), 'filter');
		if (Array.isArray(filters)) return handleResult(query(table, filters, opts), 'filter');
		// convert simple object to filters array, skipping undefined/null values
		const fArr = Object.entries(filters)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => ({ method: 'eq', column: k, value: v }));
		if (fArr.length === 0) return handleResult(list(table, opts), 'filter');
		return handleResult(query(table, fArr, opts), 'filter');
	},
	create: async (payload) => {
		const res = await create(table, payload);
		if (res?.error) {
			console.error(`[entities] create ${table} error:`, res.error);
			return null;
		}
		return res?.data ?? null;
	},
	update: async (id, payload, opts) => {
		const res = await update(table, id, payload, opts);
		if (res?.error) {
			console.error(`[entities] update ${table} error:`, res.error);
			return null;
		}
		return res?.data ?? null;
	},
	delete: async (id, opts) => {
		const res = await remove(table, id, opts);
		if (res?.error) {
			console.error(`[entities] delete ${table} error:`, res.error);
			return null;
		}
		return res?.data ?? null;
	}
});

export const Employee = makeEntity('employee');
export const Document = makeEntity('document');
export const DocumentType = makeEntity('document_type');
export const Equipment = makeEntity('equipment');
export const EquipmentRequest = makeEntity('equipment_request');
export const Workflow = makeEntity('workflow');
export const Task = makeEntity('task');
export const FormTemplate = makeEntity('form_template');
export const DocumentTemplate = makeEntity('document_template');
export const Course = makeEntity('course');
export const CourseAssignment = makeEntity('course_assignment');
export const ModuleProgress = makeEntity('module_progress');
export const EquipmentRequestItem = makeEntity('equipment_request_item');

// auth wrapper (keeps API shape similar to previous code calling base44.auth)
import { getUser, signOut, signIn, signUp, onAuthStateChange } from '@/api/supabaseClient';
export const User = {
	me: getUser,
	logout: signOut,
	signIn,
	signUp,
	onAuthStateChange
};