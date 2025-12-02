E2EE folder is backend folder.
api end points of backend :-

    /api/auth/signup
    /api/auth/signin
    /api/auth/verify
    /api/secure/photos/upload
    /api/secure/photos/list
    /api/secure/photos/delete/{id}

user flow of the backend

    1. signup :- frontend will provide followinfg details 
eg:- {
        "username": "parvh",
        "email": "p@mail.com",
        "enc_masterkey": "O45xY9R8sZrdY4xdlwAAAuWuwJzP9vdgFJzVug==",
        "enc_verificationkey": "HLLkA9Qpwy3tC+eZaU0mJ2YZt9k6IGslP17zWg==",
        "plain_verificationkey": "c82FJD9akf0msPx22s92JfpLKe91FGhs"
    }
    ->in front end we will gebnerate two keys ,verification key and master key,then we will encrypt with aes256 both of them using password derived hash key using PBKDF2 algorithm.
    -> Implemented authentication using JWT tokens and a custom Spring Security filter chain, with two-key mechanism (
 verification key + master key) for identity and encryption data (images).
 • Used PBKDF2for password-based key derivation and AES-256 to encrypt both the master key and verification key
 using the user’s password.
 • Implemented full client-side cryptography in the React frontend, performing PBKDF2, AES-GCM
 encryption/decryption, and secure photo upload/download entirely in the browser to maintain true E2EE.
 --------
 so in this api you have to give encrypted masterkey , encrypted verification key and plaintext of verification key
 and username and email
 --------------------------------
 2. signin
 {
  "username": "parv",
  "verificationKey": "" //this must be enpty string for all requests
 }   
front end will send this json to backend,and in response will get
{
    "enc_masterkey": "O45xY9R8sZrdY4xdlwAAAuWuwJzP9vdgFJzVug==",
    "enc_verificationkey": "HLLkA9Qpwy3tC+eZaU0mJ2YZt9k6IGslP17zWg=="
}
-------
now with this response frontend will decrypt enc_verificationkey to plain text and send it in /verify api.
how you will decrypt enc_verificationkey to plain text:-
you will generate key from password using  PBKDF2, and with it you will decrypt  AES-256 algorithm to get plain text.
---------------------------

3. verify
and now that plain text you will send to verify api.
{
  "username": "parvh",
  "verificationKey": "c82FJD9akf0msPx22s92JfpLKe91FGhs"
}
like this json
in response frontend will get this kind of json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXJ2aCIsImlhdCI6MTc2NDY3ODY5NiwiZXhwIjoxNzY0NjgyMjk2fQ.NWv1DchxD_L1DpzQrVhZFdrzOpBzadN2QjToyH7tQRA"
}
that is an jwt token.
save this token for latter use in upload.
--------------------------
---------------------
/api/secure/photos/upload
i am sending form data for thsi  api
this for will contain
ownerUsername -> name od user(username)
this shoud autofiled
file -> file to be uploaded 
contentType -> image
for authorisation use that stored jwt token.
keep ownername and contenttype hidden , only show the uupload opstion.other details shoud filled automatically.


The Upload is going to work this way you are going to send the encrypted file to server the encryption is going to done by frontend using the masterkey and AES-256 algorithm.
-------------------
/api/secure/photos/list
->in this api you have to send jwt token in authorisation header.
->and you will also send username 
->it will return list of all photos of that user.

