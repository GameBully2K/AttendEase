import { Server } from 'socket.io';
import { server} from './api.express.js';
import http from 'http';

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
io.listen(3002);
export default io;

