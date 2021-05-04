export default interface ApplePublicKey {
    kty: string,
    kid: string,
    use: string,
    alg: string,
    n:string,
    e:string
}
