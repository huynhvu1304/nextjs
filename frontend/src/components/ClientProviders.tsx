'use client';

import { Provider } from 'react-redux';
import { store } from '../redux/store';
import Header from './Header/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Header />
      <main>
        {children}
        <ToastContainer position="top-right" autoClose={2000} />
      </main>
    </Provider>
  );
}
