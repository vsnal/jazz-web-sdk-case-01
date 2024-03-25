import { FC, useEffect, useState } from 'react';

import {
  createJazzWebSdk,
  JazzSdk,
  getLocalDevices,
  LocalDevicesManager,
} from '@salutejs/jazz-sdk-web';
import {
  audioOutputMixerPlugin,
  videoElementPoolPlugin,
} from '@salutejs/jazz-sdk-web-plugins';

export const App: FC = () => {
  const [sdk, setSdk] = useState<JazzSdk | undefined>();

  useEffect(() => {
    // используем setTimeout чтобы "стабилизировать" баг, значение таймаута не играет роли
    // без setTimeout:
    //  - в React 17 баг не наблюдается
    //  - в React 18 баг сохраняется, но проявляется нестабильно
    setTimeout(() => {
      createSdk().then(setSdk, (error) => {
        console.error('Fail create SDK:', error);
      });
    }, 0);
  }, []);

  useEffect(() => {
    if (!sdk) {
      return;
    }

    const localDevices = getLocalDevices(sdk);

    test(localDevices).catch((error) => {
      console.error('Test failed:', error);
    });
  }, [sdk]);

  return <div>SDK ready: {Boolean(sdk).toString()}</div>;
};

async function createSdk() {
  console.log('Start creating SDK...');

  const sdk = await createJazzWebSdk({
    userAgent: 'Jazz Test App',
    plugins: [videoElementPoolPlugin(), audioOutputMixerPlugin()],
  });

  console.log('SDK created');

  return sdk;
}

async function test(localDevices: LocalDevicesManager) {
  const cleanupHandlers: (() => void)[] = [];

  try {
    console.log('Start test...');

    // проверяем разрешения пользователя

    const mediaPemissions = localDevices.userMediaPermissions.get();
    console.log('userMediaPermissions:', mediaPemissions);

    // запрашиваем разрешения на использование камеры и микрофона
    // BUG: метод requestUserMediaPermissions "зависает"

    console.log('Start requestUserMediaPermissions ...');
    const mediaPemissionsFromRequest =
      await localDevices.requestUserMediaPermissions('audio', 'video');
    console.log('requestUserMediaPermissions:', mediaPemissionsFromRequest);

    // получаем аудио-поток с микрофона
    // BUG: метод getSelectedAudioInputStream "зависает" (если исключить предыдущий)

    console.log('Start getSelectedAudioInputStream ...');
    const audioStream = await localDevices.getSelectedAudioInputStream();
    console.log('getSelectedAudioInputStream completed');

    cleanupHandlers.push(() => {
      localDevices.releaseMediaStream(audioStream);
    });

    // получаем видео-поток с камеры
    // BUG: метод getSelectedAudioInputStream "зависает" (если исключить предыдущий)

    console.log('Start getSelectedVideoInputStream ...');
    const videoStream = await localDevices.getSelectedVideoInputStream();
    console.log('getSelectedVideoInputStream completed');

    cleanupHandlers.push(() => {
      localDevices.releaseMediaStream(videoStream);
    });

    console.log('Test completed');
  } finally {
    cleanupHandlers.forEach((fn) => fn());
  }
}
