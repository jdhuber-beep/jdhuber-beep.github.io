// Facts page: static content, but only for signed-in users.
import { initPage } from './auth.js';

initPage({ required: true });
