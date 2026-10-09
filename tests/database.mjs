import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
const migrations = await Promise.all(['0001_initial_schema.sql','0002_stripe_orders.sql','0003_security.sql'].map(n=>readFile(new URL('../migrations/'+n,import.meta.url),'utf8')));
export class Database {
  sqlite = new DatabaseSync(':memory:');
  paidTransitions = 0;
  constructor(){for(const migration of migrations)this.sqlite.exec(migration)}
  prepare(sql){const db=this;let args=[];return {
    bind(...values){args=values;return this},
    async first(){return db.sqlite.prepare(sql).get(...args)||null},
    async all(){return {results:db.sqlite.prepare(sql).all(...args)}},
    async run(){const result=db.sqlite.prepare(sql).run(...args);if(sql.includes("SET payment_status = 'paid'"))db.paidTransitions+=Number(result.changes);return {success:true,meta:{changes:Number(result.changes)}}},
  }}
  get rows(){return new Map(this.sqlite.prepare('SELECT * FROM stripe_orders').all().map(r=>[r.id,r]))}
}
