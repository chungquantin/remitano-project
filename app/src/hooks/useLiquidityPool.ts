import { useEffect } from 'react';
import { useAnchorProgram } from './useAnchorProgram';

export const useLiquidityPool = () => {
    const program = useAnchorProgram();
    useEffect(() => {
        console.log(program?.account);
    }, [program]);
};
