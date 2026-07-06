import Login from '../components/Login.js';

export default {
  name: 'LoginView',
  components: {
    Login
  },
  template: `
    <login @login-success="onSuccess"></login>
  `,
  setup(props, { emit }) {
    const router = VueRouter.useRouter();
    
    const onSuccess = () => {
      router.push('/dashboard');
    };

    return {
      onSuccess
    };
  }
};
