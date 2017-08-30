import { Reducer } from "redux"

export function syncFirebase(): {unsubscribe(): void}
export function firebaseToProps<T>(firebaseBindings: Array<string>, mapStateToProps?: (state: any, props: any) => T): any
export function firebaseReducer(): Reducer<{}>
export interface WriteInterface {
  method: string,
  path: string | Function,
  value: any,
  ownProps: any
}
export interface FirebaseActions {
  updateConfig(options: any): any,
  addArrayChild(path: string, key: string, value: any, previousChildKey: string): any,
  changeArrayChild(path: string, key: string, value: string): any,
  moveArrayChild(path: string, snapshot: any, previousChildKey: string): any,
  removeArrayChild(path: string, snapshot: any): any,
  updateArray(path: string, key: string, value: string[]): any,
  updateObject(path: string, snapshot: any): any,
  replaceValue(path: string, value: string): any,
  completeInitialFetch(): any,
  receiveInitialValue(path: string): any,
  connect(): any,
  authenticateUser(authData: any): any,
  unauthenticateUser(): any,
  passwordLogin(email: string, password: string): any,
  oAuthLogin(flowCode: string, providerCode: string, scopes: string[]): any,
  logout(): any,
  createUser(email: string, password: string): any,
  resetPassword(email: string): any,
  write(options: WriteInterface): any,
  clearLoginError(): any,
  clearRegistrationError(): any,
  clearResetPasswordError(): any,
  clearWriteErrors(path: string): any,
  revokePermissions(error: any): any,
  clearPermissionsError(): any
}

export const firebaseActions: FirebaseActions
