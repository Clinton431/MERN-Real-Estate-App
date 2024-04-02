import {auth} from 'express-oauth2-jwt-bearer'

const jwtCheck = auth({
    audience: "http://localhost:8000",
    issuerBaseURL: "https://dev-scardzcgad2i00dm.us.auth0.com/api/v2/",
    tokenSigningAlg: "RS256"
})

export default jwtCheck