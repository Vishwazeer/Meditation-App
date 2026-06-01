import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // In production, this would send to Sentry
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={s.container}>
          <Text style={s.warningIcon}>{'\u{26A0}'}</Text>
          <Text style={s.title}>
            Something went wrong
          </Text>
          <Text style={s.message}>
            We're sorry for the inconvenience. Please try again.
          </Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={this.handleRetry}
          >
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
  },
  warningIcon: {
    fontSize: moderateScale(32),
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(16),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  retryButton: {
    backgroundColor: '#1B4332',
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
});
