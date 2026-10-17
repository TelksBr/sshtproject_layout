import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { ConfigItem } from '../src/types/config';
import { getVisibleCredentialFields, mergeCredentialHints } from '../src/utils/configCredentials';

const ssh: ConfigItem = { id: 1, name: 'SSH', mode: 'ssh', description: null, sorter: 0, icon: null };
const none = { username: false, password: false, uuid: false };

test('no selection and native placeholder configs do not ask for credentials', () => {
  assert.deepEqual(getVisibleCredentialFields(null), none);
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, id: 0 }), none);
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, id: -1 }), none);
});
test('embedded credentials hide fields even with conflicting old flags', () => {
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, auth: { username: 'embedded', password: 'embedded' }, requires_username: true, requires_password: true }), none);
});
test('only the missing credential is requested', () => {
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, auth: { username: 'embedded' } }), { username: false, password: true, uuid: false });
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, password: 'embedded' }), { username: true, password: false, uuid: false });
});
test('native hints suppress fields for protected credentials that are not exposed in JSON', () => {
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, requires_username: false, requires_password: false }), none);
});
test('UUID is requested only for a selected V2Ray config without an embedded UUID', () => {
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, mode: 'vless' }), { username: false, password: false, uuid: true });
  assert.deepEqual(getVisibleCredentialFields({ ...ssh, mode: 'vless', auth: { v2ray_uuid: 'embedded' } }), none);
});
test('partial selected config gets missing hints and auth from its own catalog entry', () => {
  const selected = { ...ssh, auth: {}, requires_username: false };
  const merged = mergeCredentialHints(selected, [{ id: 1, name: 'Group', sorter: 0, color: '', items: [{ ...ssh, auth: { password: 'embedded' } }] }]);
  assert.deepEqual(getVisibleCredentialFields(merged), none);
});
