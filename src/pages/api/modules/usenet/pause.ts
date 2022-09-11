import { getCookie } from 'cookies-next';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'sabnzbd-api';
import { getConfig } from '../../../../tools/getConfig';
import { getServiceById } from '../../../../tools/hooks/useGetServiceByType';
import { Config } from '../../../../tools/types';

dayjs.extend(duration);

export interface UsenetPauseRequestParams {
  serviceId: string;
}

async function Post(req: NextApiRequest, res: NextApiResponse) {
  try {
    const configName = getCookie('config-name', { req });
    const { config }: { config: Config } = getConfig(configName?.toString() ?? 'default').props;
    const { serviceId } = req.query as any as UsenetPauseRequestParams;

    const service = getServiceById(config, serviceId);

    if (!service) {
      throw new Error(`Service with ID "${req.query.serviceId}" could not be found.`);
    }

    if (!service.apiKey) {
      throw new Error(`API Key for service "${service.name}" is missing`);
    }

    const { origin } = new URL(service.url);

    const result = await new Client(origin, service.apiKey).queuePause();

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).send((err as any).message);
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Filter out if the reuqest is a POST or a GET
  if (req.method === 'POST') {
    return Post(req, res);
  }
  return res.status(405).json({
    statusCode: 405,
    message: 'Method not allowed',
  });
};