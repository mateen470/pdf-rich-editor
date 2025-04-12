import pool from "./sql_pool";

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB CONNECTION ERROR", err);
  } else {
    console.log("DB CONNECTION SUCCESSFULL", res.rows[0].now);
  }
});

export default pool;
