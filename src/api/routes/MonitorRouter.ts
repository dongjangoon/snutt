import ExpressPromiseRouter from 'express-promise-router';
var router = ExpressPromiseRouter();
import { restGet } from '../decorator/RestDecorator';

restGet(router, '/l7check')(() => Promise.resolve({ message: "OK" }));

export = router;
