import { Provide } from '@midwayjs/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ok, fail } from '../utils/responseHelper';

dayjs.extend(utc);
dayjs.extend(timezone);

@Provide()
export class BaseController {
  ok = ok;
  fail = fail;
}
