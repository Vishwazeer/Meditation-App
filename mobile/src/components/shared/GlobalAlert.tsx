import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAlertStore } from '../../store/alertStore';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

// Monkey-patch Alert.alert globally to intercept native platform dialogs
Alert.alert = (alertTitle, alertMessage, alertButtons) => {
  useAlertStore.getState().showAlert(alertTitle, alertMessage || '', alertButtons);
};

export const GlobalAlert = () => {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();

  if (!visible) return null;

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={hideAlert}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={buttons.length > 2 ? styles.buttonColumn : styles.buttonRow}>
        {buttons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          const isDestructive = btn.style === 'destructive';
          
          const buttonStyle = [
            styles.button,
            buttons.length > 2 ? styles.columnBtn : styles.flexBtn,
            isCancel ? styles.cancelButton : styles.confirmButton,
            isDestructive ? styles.destructiveButton : null,
          ];
          
          const textStyle = [
            isCancel ? styles.cancelButtonText : styles.confirmButtonText,
            isDestructive ? styles.destructiveButtonText : null,
          ];

          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              activeOpacity={0.7}
              onPress={() => {
                hideAlert();
                btn.onPress?.();
              }}
            >
              <Text style={textStyle}>{btn.text || 'Button'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {!!message && <Text style={styles.modalSubtitle}>{message}</Text>}
          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(24),
    width: '100%',
    maxWidth: scale(340),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    elevation: 5,
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: verticalScale(8),
    width: '100%',
  },
  button: {
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBtn: {
    flex: 1,
  },
  columnBtn: {
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
  },
  cancelButtonText: {
    color: '#87553E',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  confirmButton: {
    backgroundColor: '#ED7624',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  destructiveButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  destructiveButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
});
