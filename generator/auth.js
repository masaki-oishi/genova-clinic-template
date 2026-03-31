/**
 * Google API 認証共通モジュール
 * Docs / Drive / Sheets で同一の認証情報を使い回す
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _auth = null;

async function getAuth() {
  if (_auth) return _auth;

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, 'credentials.json');

  try {
    const keyFile = JSON.parse(await fs.readFile(keyPath, 'utf-8'));

    if (keyFile.type === 'service_account') {
      _auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: [
          'https://www.googleapis.com/auth/documents.readonly',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
      });
    } else {
      const { client_id, client_secret, redirect_uris } = keyFile.installed || keyFile.web;
      const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      const tokenPath = path.join(path.dirname(keyPath), 'token.json');
      const token = JSON.parse(await fs.readFile(tokenPath, 'utf-8'));
      oauth2.setCredentials(token);
      _auth = oauth2;
    }
  } catch {
    throw new Error(
      'Google認証情報が見つかりません。\n' +
      'credentials.json をgeneratorディレクトリに配置するか、\n' +
      'GOOGLE_APPLICATION_CREDENTIALS 環境変数を設定してください。'
    );
  }

  return _auth;
}

export async function getDocsClient() {
  return google.docs({ version: 'v1', auth: await getAuth() });
}

export async function getDriveClient() {
  return google.drive({ version: 'v3', auth: await getAuth() });
}
