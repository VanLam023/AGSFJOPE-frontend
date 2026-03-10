import React, { useState } from 'react';
import AuthLayout from '../../../layouts/AuthLayout';
import { useNavigate } from 'react-router-dom';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

const ResetPassword = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();

    const next = () => {
        setCurrentStep(prev => prev + 1);
    };

    const goToLogin = () => {
        navigate('/login');
    };

    return <AuthLayout>
        {currentStep === 1 && <Step1 callback={next} />}
        {currentStep === 2 && <Step2 callback={next} />}
        {currentStep === 3 && <Step3 callback={next} />}
        {currentStep === 4 && <Step4 callback={goToLogin} />}
  </AuthLayout>;
};

export default ResetPassword;
