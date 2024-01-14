import {
  SchedulerClient,
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  DeleteScheduleCommand,
  DeleteScheduleCommandInput,
} from '@aws-sdk/client-scheduler';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const client = new SchedulerClient({
  region: process.env.REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_CONFIG_SECRET_KEY || '',
  },
});

export async function createScheduleFromNow({
  scheduleName,
  hour,
  minutes,
  Target,
}: {
  scheduleName: string;
  hour?: number;
  minutes: number;
  Target: {
    Arn: string;
    RoleArn: string;
    Input: any;
  };
}) {
  let atInstance = dayjs.utc();

  if (hour) atInstance = atInstance.add(hour, 'h');

  atInstance = atInstance.add(minutes, 'm');

  const scheduleInput: CreateScheduleCommandInput = {
    Name: scheduleName,
    ScheduleExpression: `at(${atInstance.format('YYYY-MM-DDTHH:mm:ss')})`,
    ScheduleExpressionTimezone: 'UTC',
    FlexibleTimeWindow: {
      Mode: 'OFF',
    },
    State: 'ENABLED',
    Target: {
      ...Target,
      Input: JSON.stringify({
        ...Target.Input,
      }),
    },
  };

  await client.send(new CreateScheduleCommand(scheduleInput));
}

export async function deleteSchedule(scheduleName: string) {
  const deleteScheduleInput: DeleteScheduleCommandInput = {
    Name: scheduleName,
  };

  try {
    await client.send(new DeleteScheduleCommand(deleteScheduleInput));
  } catch (err: any) {
    // Ignore error
  }
}
