import {
	list,
	get,
	create,
	update,
	remove,
	query
} from '@/api/supabaseClient';

const makeEntity = (table) => ({
	list: (opts) => list(table, opts),
	get: (id, opts) => get(table, id, opts),
	// filter supports either object { key: value } or array of filter descriptors
	filter: (filters, opts = {}) => {
		if (!filters) return list(table, opts);
		if (Array.isArray(filters)) return query(table, filters, opts);
		// convert simple object to filters array
		const fArr = Object.keys(filters).map((k) => ({ method: 'eq', column: k, value: filters[k] }));
		return query(table, fArr, opts);
	},
	create: (payload) => create(table, payload),
	update: (id, payload, opts) => update(table, id, payload, opts),
	delete: (id, opts) => remove(table, id, opts)
});

export const Employee = makeEntity('employees');
export const Document = makeEntity('documents');
export const DocumentType = makeEntity('document_types');
export const Equipment = makeEntity('equipment');
export const EquipmentRequest = makeEntity('equipment_requests');
export const Workflow = makeEntity('workflows');
export const Task = makeEntity('tasks');
export const FormTemplate = makeEntity('form_templates');
export const DocumentTemplate = makeEntity('document_templates');
export const Course = makeEntity('courses');
export const CourseAssignment = makeEntity('course_assignments');
export const ModuleProgress = makeEntity('module_progress');
export const EquipmentRequestItem = makeEntity('equipment_request_items');

// auth wrapper (keeps API shape similar to previous code calling base44.auth)
import { getUser, signOut, signIn, signUp, onAuthStateChange } from '@/api/supabaseClient';
export const User = {
	me: getUser,
	logout: signOut,
	signIn,
	signUp,
	onAuthStateChange
};