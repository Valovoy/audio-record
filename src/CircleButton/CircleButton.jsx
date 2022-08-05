import cn from 'classnames'
import styles from './CircleButton.module.css'

const CircleButton = ({
  Icon,
  btnClassName,
  iconClassName,
  isPrimary = false,
  onClickAction = () => null,
  isDisabled = false,
}) => (
  <button
    onClick={onClickAction}
    className={cn(
      styles.btn,
      isPrimary && styles.primary,
      btnClassName,
      isDisabled && styles.isDisabled,
    )}
    disabled={isDisabled}
  >
    <Icon className={iconClassName} />
  </button>
)

export default CircleButton
