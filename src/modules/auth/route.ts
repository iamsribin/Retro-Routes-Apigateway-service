import express,{Application} from 'express'
import { handleLogout, refreshToken } from '../auth/controller'

const rideRoute:Application=express()


rideRoute.post('/refresh',refreshToken)
rideRoute.post('/logout',handleLogout)

export default rideRoute