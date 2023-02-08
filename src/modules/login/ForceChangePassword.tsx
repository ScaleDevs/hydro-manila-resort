import { useState } from 'react';
import { Heading, Stack, Button, HStack, chakra, Text, SlideFade } from '@chakra-ui/react';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BsCheck, BsX } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import { RegexValidations } from '@/utils/helper';
import useLogin from '@/hooks/useLogin.hook';
import { PasswordInput } from '@/components/PasswordInput';
import { ErrorAlert } from '@/components/ErrorAlert';
import useAuthStoreTrack from '@/store/auth.store';

const CheckIcon = chakra(BsCheck);
const XIcon = chakra(BsX);

const PwdReqItem = ({ title, isPassed }: { title: string; isPassed: boolean }) => {
  return (
    <HStack>
      {isPassed ? <CheckIcon h='20px' w='20px' color='green.500' /> : <XIcon h='20px' w='20px' color='red.500' />}
      <Text color={isPassed ? 'green.500' : 'red.500'} transition='color 0.25s'>
        {title}
      </Text>
    </HStack>
  );
};

const schema = z.object({
  newPassword: z.string(),
  confirmNewPassword: z.string(),
});

type FormSchemaType = z.infer<typeof schema>;

function ForceChangePassword() {
  const { mutate, isLoading, isError } = trpc.auth.forceChangePassword.useMutation();
  const { session, username } = useAuthStoreTrack();
  const { updateAuthStates } = useLogin();

  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [passMinCharLength, setPassMinCharLength] = useState(false);
  const [passNum, setPassNum] = useState(false);
  const [passLowCase, setPassLowCase] = useState(false);
  const [passUpCase, setPassUpCase] = useState(false);
  const [passSpecialChar, setPassSpecialChar] = useState(false);
  const [conditionsPassed, setConditionsPassed] = useState(0);

  const { handleSubmit, register } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onPasswordValidation = (e: any) => {
    const newValue = e.target.value;
    if (newValue.length >= 8 && !passMinCharLength) {
      setPassMinCharLength(true);
      setConditionsPassed((i) => i + 1);
    } else if (!(newValue.length >= 8) && passMinCharLength) {
      setPassMinCharLength(false);
      setConditionsPassed((i) => i - 1);
    }

    if (RegexValidations.hasNumber.exec(newValue) && !passNum) {
      setPassNum(true);
      setConditionsPassed((i) => i + 1);
    } else if (!RegexValidations.hasNumber.exec(newValue) && passNum) {
      setPassNum(false);
      setConditionsPassed((i) => i - 1);
    }

    if (RegexValidations.hasLowerCase.exec(newValue) && !passLowCase) {
      setPassLowCase(true);
      setConditionsPassed((i) => i + 1);
    } else if (!RegexValidations.hasLowerCase.exec(newValue) && passLowCase) {
      setPassLowCase(false);
      setConditionsPassed((i) => i - 1);
    }

    if (RegexValidations.hasUpperCase.exec(newValue) && !passUpCase) {
      setPassUpCase(true);
      setConditionsPassed((i) => i + 1);
    } else if (!RegexValidations.hasUpperCase.exec(newValue) && passUpCase) {
      setPassUpCase(false);
      setConditionsPassed((i) => i - 1);
    }

    if (RegexValidations.hasSpecialChar.exec(newValue) && !passSpecialChar) {
      setPassSpecialChar(true);
      setConditionsPassed((i) => i + 1);
    } else if (!RegexValidations.hasSpecialChar.exec(newValue) && passSpecialChar) {
      setPassSpecialChar(false);
      setConditionsPassed((i) => i - 1);
    }
  };

  const forceChangePassword = (formData: FormSchemaType) => {
    if (conditionsPassed < 5) {
      setErrMessage('Password does not meet requirements');
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrMessage('Password does not match');
      return;
    }

    if (!session || !username) {
      setErrMessage('Invalid Session, Login again');
      return;
    }

    mutate(
      { username, newPassword: formData.newPassword, session: session },
      {
        onSuccess(data) {
          const { authResult, expiresAt } = data;
          if (authResult.AuthenticationResult)
            updateAuthStates({
              AccessToken: authResult.AuthenticationResult.AccessToken,
              IdToken: authResult.AuthenticationResult.IdToken,
              ExpiresIn: authResult.AuthenticationResult.ExpiresIn,
              expiresAt,
            });
        },
        onError(error: any) {
          if (error.message.includes('Invalid Session')) setErrMessage('Invalid Session, kindly login again');
          else setErrMessage(error.message);

          setTimeout(() => {
            setErrMessage(null);
          }, 5000);
        },
      },
    );
  };

  return (
    <SlideFade in>
      <Heading as='h1' size={{ base: 'md', md: 'lg' }} noOfLines={1} textAlign='center'>
        MUST CHANGE PASSWORD
      </Heading>

      <form onSubmit={handleSubmit(forceChangePassword)}>
        <Stack spacing='5' mt='20px'>
          <PasswordInput
            formInput={{ register, property: 'newPassword' }}
            placeholder='ENTER NEW PASSWORD HERE'
            onChange={onPasswordValidation}
          />

          <PasswordInput
            formInput={{ register, property: 'confirmNewPassword' }}
            placeholder='CONFIRM NEW PASSWORD HERE'
            onChange={onPasswordValidation}
          />

          <Stack fontSize={{ base: 'sm', md: 'md' }}>
            <PwdReqItem isPassed={passMinCharLength} title='Password minimum length 8 characters' />
            <PwdReqItem isPassed={passNum} title='Contains at least 1 number' />
            <PwdReqItem isPassed={passSpecialChar} title='Contains at least 1 special character' />
            <PwdReqItem isPassed={passUpCase} title='Contains at least 1 uppercase letter' />
            <PwdReqItem isPassed={passLowCase} title='Contains at least 1 lowercase letter' />
          </Stack>

          {!!errMessage ? <ErrorAlert message={errMessage} /> : ''}
          {!!isError ? <ErrorAlert message='Something went wrong, Try Again' /> : ''}

          <Button type='submit' isLoading={isLoading}>
            SUBMIT
          </Button>
        </Stack>
      </form>
    </SlideFade>
  );
}

export default ForceChangePassword;
