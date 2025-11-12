import React, { useEffect, useState } from "react";
import sodium from "libsodium-wrappers";

/*
  Minimal React single-file frontend matched to your backend.

  Usage:
  - npm create vite@latest myapp (React -> JavaScript)
  - cd myapp
  - npm install libsodium-wrappers
  - replace src/App.jsx or src/App.js with this file
  - npm run dev
*/

export default function App() {
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState("signin"); // signin | signup | dashboard
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jwt, setJwt] = useState(localStorage.getItem("jwt") || "");
  const [message, setMessage] = useState("");
  const [encMaster, setEncMaster] = useState(null);
  const [encVerif, setEncVerif] = useState(null);
  const [masterKeyInMemory, setMasterKeyInMemory] = useState(null);

  // change if your backend is on another host/port
  const API_BASE = "http://localhost:8080";

  useEffect(() => {
    (async () => {
      await sodium.ready;
      setReady(true);
    })();
  }, []);

  // helpers
  const b64 = (u8) => sodium.to_base64(u8, sodium.base64_variants.ORIGINAL);
  const fromB64 = (s) => sodium.from_base64(s, sodium.base64_variants.ORIGINAL);

  // Derive KEK from password + salt (Argon2id via libsodium crypto_pwhash)
  // We'll use a randomly generated salt during signup and include it in the enc blob payload (nonce etc).
  async function deriveKEK(password, saltUint8) {
    const pw = sodium.from_string(password);
    const outLen = 32;
    // using moderate ops/mem (adjust for your target devices)
    const ops = sodium.crypto_pwhash_OPSLIMIT_MODERATE;
    const mem = sodium.crypto_pwhash_MEMLIMIT_MODERATE;
    const kek = sodium.crypto_pwhash(
      outLen,
      pw,
      saltUint8,
      ops,
      mem,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );
    sodium.memzero(pw);
    return kek;
  }

  // AEAD encrypt (XChaCha20-Poly1305)
  function aeadEncrypt(key, plaintextUint8, aadUint8 = null) {
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintextUint8,
      aadUint8,
      null,
      nonce,
      key
    );
    return {
      nonce: b64(nonce),
      ct: b64(ct),
    };
  }
  function aeadDecrypt(key, nonceB64, ctB64, aadUint8 = null) {
    const nonce = fromB64(nonceB64);
    const ct = fromB64(ctB64);
    const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, aadUint8, nonce, key);
    return pt; // Uint8Array
  }

  // Signup: generate MASTER_KEY & VERIF_TOKEN, derive KEK, encrypt both, send to backend
  async function signup() {
    setMessage("Signing up...");
    if (!username || !password) return setMessage("username + password required");
    try {
      // generate salt for KDF and keep it as part of encryption metadata by placing it inside enc blob
      const salt = sodium.randombytes_buf(16);

      const kek = await deriveKEK(password, salt);

      // generate master & verification tokens
      const MASTER_KEY = sodium.randombytes_buf(32);
      const VERIF_TOKEN = sodium.randombytes_buf(32);

      // AAD to bind to user+version
      const aadVerif = sodium.from_string(`vt:${username}:v1`);
      const aadMaster = sodium.from_string(`mk:${username}:v1`);

      // encrypt tokens with KEK
      const encMasterLocal = aeadEncrypt(kek, MASTER_KEY, aadMaster);
      const encVerifLocal = aeadEncrypt(kek, VERIF_TOKEN, aadVerif);

      // For server fields we must include the salt used to derive KEK so that other devices can derive KEK
      // We'll store salt inside the enc blob JSON (so frontend and server agree on what to return)
      // Build final strings for the server (JSON stringified)
      const payloadEncMaster = JSON.stringify({
        nonce: encMasterLocal.nonce,
        ct: encMasterLocal.ct,
        salt: b64(salt),
        aad: "mk:" + username + ":v1",
      });
      const payloadEncVerif = JSON.stringify({
        nonce: encVerifLocal.nonce,
        ct: encVerifLocal.ct,
        salt: b64(salt),
        aad: "vt:" + username + ":v1",
      });

      // IMPORTANT: your backend SignupRequest includes plain_verificationkey (server currently stores it).
      const plain_verificationkey = b64(VERIF_TOKEN);

      // send to backend
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          enc_masterkey: payloadEncMaster,
          enc_verificationkey: payloadEncVerif,
          plain_verificationkey, // backend expects this per your current code
        }),
      });

      if (!res.ok) throw new Error(`Signup failed: ${res.status} ${await res.text()}`);
      setMessage("Signup ok. You can sign in now.");
      // store local copies for convenience in demo
      setEncMaster(payloadEncMaster);
      setEncVerif(payloadEncVerif);
      // keep master key in memory if you want immediate upload, otherwise leave null
      setMasterKeyInMemory(MASTER_KEY);
      sodium.memzero(kek);
      sodium.memzero(VERIF_TOKEN);
    } catch (e) {
      console.error(e);
      setMessage("Signup error: " + (e.message || e));
    }
  }

  // Signin: request encrypted blobs for a username (server returns enc_masterkey & enc_verificationkey strings)
  async function signinFetchEncrypted() {
    setMessage("Requesting encrypted blobs (signin)...");
    if (!username) return setMessage("username required");
    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error(`Signin fetch failed ${res.status}`);
      const data = await res.json();
      // server returns enc_masterkey and enc_verificationkey (as strings)
      setEncMaster(data.enc_masterkey);
      setEncVerif(data.enc_verificationkey);
      setMessage("Encrypted blobs received. Now call 'Verify (complete signin)' with password.");
    } catch (e) {
      console.error(e);
      setMessage("Error fetching encrypted blobs: " + (e.message || e));
    }
  }

  // Verify: decrypt verification token locally with password-derived KEK and send plaintext to /api/auth/verify to get JWT
  async function verifyAndGetJwt() {
    setMessage("Verifying...");
    if (!encVerif) return setMessage("No enc_verificationkey available. Fetch sign-in blobs first.");
    if (!password) return setMessage("Enter password to decrypt verification key.");
    try {
      // parse server-provided enc blob (we built it as JSON string containing nonce,ct,salt)
      const obj = JSON.parse(encVerif);
      const salt = fromB64(obj.salt);
      const kek = await deriveKEK(password, salt);
      const verifUint8 = aeadDecrypt(kek, obj.nonce, obj.ct, sodium.from_string(`vt:${username}:v1`));
      const verifB64 = b64(verifUint8);

      // send decrypted verificationKey (plaintext) to /api/auth/verify
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, verificationKey: verifB64 }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Verify failed ${res.status} ${t}`);
      }
      const json = await res.json();
      if (json.success && json.token) {
        localStorage.setItem("jwt", json.token);
        setJwt(json.token);
        setMessage("Verification successful — JWT stored.");
        setPhase("dashboard");

        // optionally decrypt master key now
        if (encMaster) {
          try {
            const mObj = JSON.parse(encMaster);
            const mk = aeadDecrypt(kek, mObj.nonce, mObj.ct, sodium.from_string(`mk:${username}:v1`));
            setMasterKeyInMemory(mk);
          } catch (e) {
            console.warn("failed decrypt master key locally:", e);
          }
        }
      } else {
        throw new Error("verify response did not include token");
      }
      sodium.memzero(kek);
    } catch (e) {
      console.error(e);
      setMessage("Verify error: " + (e.message || e));
    }
  }

  function logout() {
    localStorage.removeItem("jwt");
    setJwt("");
    setMasterKeyInMemory(null);
    setPhase("signin");
    setMessage("Logged out.");
  }

  async function callProtectedTest() {
    setMessage("Calling protected /secure/test ...");
    try {
      const res = await fetch(`${API_BASE}/secure/test`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const txt = await res.text();
      setMessage("Protected response: " + txt);
    } catch (e) {
      setMessage("Call protected failed: " + (e.message || e));
    }
  }

  // UI
  if (!ready) return <div>Loading libsodium...</div>;

  if (phase === "signup") {
    return (
      <div style={styles.container}>
        <h2>Signup (frontend encrypts keys)</h2>
        <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} />
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
        <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={signup} style={styles.button}>Sign up</button>
          <button onClick={() => setPhase("signin")} style={styles.link}>Back to Sign in</button>
        </div>
        <p>{message}</p>
      </div>
    );
  }

  if (phase === "signin" && !jwt) {
    return (
      <div style={styles.container}>
        <h2>Sign in (fetch encrypted blobs → verify)</h2>
        <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={signinFetchEncrypted} style={styles.button}>Request encrypted blobs (signin)</button>
          <button onClick={() => setPhase("signup")} style={styles.link}>Go to Signup</button>
        </div>

        <hr style={{ width: "100%" }} />

        <h3>Complete sign in (decrypt & verify)</h3>
        <input type="password" placeholder="password (to decrypt verificationKey)" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
        <button onClick={verifyAndGetJwt} style={styles.button}>Verify (get JWT)</button>

        <p>{message}</p>
        <pre style={styles.pre}>{encVerif ? encVerif : "no enc_verificationkey yet"}</pre>
      </div>
    );
  }

  // dashboard
  return (
    <div style={styles.container}>
      <h2>Dashboard</h2>
      <p>Signed in as: {username || "(unknown)"}</p>
      <button onClick={callProtectedTest} style={styles.button}>Call protected /secure/test</button>
      <button onClick={logout} style={{ ...styles.button, background: "#c33" }}>Logout</button>

      <div style={{ marginTop: 12 }}>
        <h4>Master key (in memory):</h4>
        <pre style={styles.pre}>{masterKeyInMemory ? b64(masterKeyInMemory) : "not decrypted yet"}</pre>
      </div>

      <p>{message}</p>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: "48px auto", padding: 16, textAlign: "center", fontFamily: "Inter, Arial" },
  input: { display: "block", width: "100%", margin: "8px 0", padding: 8, fontSize: 16 },
  button: { padding: "8px 14px", background: "#1976d2", color: "white", border: "none", cursor: "pointer", marginTop: 8 },
  link: { padding: "8px 14px", background: "#eee", border: "none", cursor: "pointer", marginTop: 8 },
  pre: { textAlign: "left", maxHeight: 200, overflow: "auto", background: "#f7f7f7", padding: 8 },
};
