enum validEnvironments {
  development = 'development',
  production = 'production',
}

const logLevels: {
  [key: string]: number;
} = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

enum UserStatus {
  NOT_VERIFIED = 0,
  VERIFIED = 1,
  RESET_PASSWORD_ON_LOGIN = 2,
}

enum RoleStatus {
  DISABLED = 0,
  ACTIVE = 1,
}

export { validEnvironments, logLevels, UserStatus, RoleStatus };
