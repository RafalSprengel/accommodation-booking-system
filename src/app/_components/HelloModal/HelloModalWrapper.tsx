'use client';

import dynamic from 'next/dynamic';

const HelloModal = dynamic(() => import('./HelloModal'), { ssr: false });

const HelloModalWrapper = () => {
    return <HelloModal />;
};

export default HelloModalWrapper;