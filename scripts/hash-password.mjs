#!/usr/bin/env node
/**
 * Génère un hash bcrypt à coller dans ADMIN_PASSWORD_HASH.
 *
 *   npm run hash-password -- "mon mot de passe"
 */
import bcrypt from 'bcryptjs';

const password = process.argv.slice(2).join(' ').trim();

if (!password) {
  console.error('Usage : npm run hash-password -- "mot de passe"');
  process.exit(1);
}

if (password.length < 10) {
  console.error('Le mot de passe doit contenir au moins 10 caractères.');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
