import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { setTokenGetter, clearCache } from '../utils/api';

const pool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId:   import.meta.env.VITE_USER_POOL_CLIENT_ID,
});

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // { sub, email, name }
  const [loading, setLoading]   = useState(true);   // checking existing session
  const [cognitoUser, setCognitoUser] = useState(null);

  // Get the current ID token (refreshes if expired)
  const getToken = useCallback(() =>
    new Promise((resolve, reject) => {
      const cu = pool.getCurrentUser();
      if (!cu) return reject(new Error('Not signed in'));
      cu.getSession((err, session) => {
        if (err) return reject(err);
        resolve(session.getIdToken().getJwtToken());
      });
    }), []);

  // Register the token getter with the API client
  useEffect(() => { setTokenGetter(getToken); }, [getToken]);

  // Restore existing session on mount
  useEffect(() => {
    const cu = pool.getCurrentUser();
    if (!cu) { setLoading(false); return; }
    cu.getSession((err, session) => {
      if (err || !session.isValid()) { setLoading(false); return; }
      cu.getUserAttributes((attrErr, attrs) => {
        if (!attrErr) {
          const map = Object.fromEntries(attrs.map(a => [a.getName(), a.getValue()]));
          setUser({ sub: map.sub, email: map.email, name: map.name });
          setCognitoUser(cu);
        }
        setLoading(false);
      });
    });
  }, []);

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = (email, password, name) =>
    new Promise((resolve, reject) => {
      const attrs = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name',  Value: name  }),
      ];
      pool.signUp(email, password, attrs, null, (err, result) => {
        if (err) return reject(err);
        setCognitoUser(result.user);
        resolve(result);
      });
    });

  // ── Confirm Sign Up ────────────────────────────────────────────────────────
  const confirmSignUp = (email, code) =>
    new Promise((resolve, reject) => {
      const cu = cognitoUser || new CognitoUser({ Username: email, Pool: pool });
      cu.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  // ── Resend confirmation code ───────────────────────────────────────────────
  const resendCode = (email) =>
    new Promise((resolve, reject) => {
      const cu = new CognitoUser({ Username: email, Pool: pool });
      cu.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  // ── Sign In ────────────────────────────────────────────────────────────────
  const signIn = (email, password) =>
    new Promise((resolve, reject) => {
      const cu = new CognitoUser({ Username: email, Pool: pool });
      cu.authenticateUser(
        new AuthenticationDetails({ Username: email, Password: password }),
        {
          onSuccess: (session) => {
            cu.getUserAttributes((err, attrs) => {
              const map = err ? {} : Object.fromEntries(attrs.map(a => [a.getName(), a.getValue()]));
              const userData = { sub: map.sub, email: map.email, name: map.name || email };
              setUser(userData);
              setCognitoUser(cu);
              resolve(userData);
            });
          },
          onFailure: reject,
        }
      );
    });

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = () => {
    pool.getCurrentUser()?.signOut();
    setUser(null);
    setCognitoUser(null);
    clearCache();
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = (email) =>
    new Promise((resolve, reject) => {
      const cu = new CognitoUser({ Username: email, Pool: pool });
      cu.forgotPassword({ onSuccess: resolve, onFailure: reject });
    });

  const confirmNewPassword = (email, code, newPassword) =>
    new Promise((resolve, reject) => {
      const cu = new CognitoUser({ Username: email, Pool: pool });
      cu.confirmPassword(code, newPassword, { onSuccess: resolve, onFailure: reject });
    });

  return (
    <AuthContext.Provider value={{
      user, loading,
      signUp, confirmSignUp, resendCode,
      signIn, signOut,
      forgotPassword, confirmNewPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
