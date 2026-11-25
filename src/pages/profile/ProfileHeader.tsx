import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { FaChartPie, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useUserProfile, type UserProfile } from '../../hooks/useUserProfile';
import {
  FAVORITE_FORMATS,
  racesForFormat,
  getFavoriteFormatLabel,
  isPbFavoriteFormat,
  type FavoriteFormatId,
  type FavoriteRacesMap,
} from '../../config/profileOptions';
import styles from '../ProfilePage.module.css';

interface ProfileHeaderProps {
  profile: UserProfile;
  setProfile: Dispatch<SetStateAction<UserProfile | null>>;
  isOwner: boolean;
  premierPlayerName: string | null;
}

/** Avatar, username and favorite format/races; editable by the owner. */
export default function ProfileHeader({ profile, setProfile, isOwner, premierPlayerName }: ProfileHeaderProps) {
  const { updateProfile, uploadAvatar, loading: saving } = useUserProfile();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveUsername = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile.username) {
      setEditingName(false);
      return;
    }
    const { error } = await updateProfile({ username: trimmed });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, username: trimmed } : prev));
    setEditingName(false);
    setSaveMessage('Nombre actualizado');
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleAvatarButtonClick = () => {
    const input = avatarInputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { url, error } = await uploadAvatar(file);
    setAvatarUploading(false);
    if (error) {
      setSaveMessage(error);
      return;
    }
    if (url) setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleFavoriteFormatChange = async (formatId: FavoriteFormatId | '') => {
    if (!isOwner) return;
    const value = formatId || null;
    const { error } = await updateProfile({ favorite_format: value });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, favorite_format: value } : prev));
  };

  const handleFavoriteRaceChange = async (formatId: FavoriteFormatId, race: string) => {
    if (!isOwner) return;
    const nextRaces: FavoriteRacesMap = { ...profile.favorite_races };
    if (race) nextRaces[formatId] = race;
    else delete nextRaces[formatId];
    const { error } = await updateProfile({ favorite_races: nextRaces });
    if (error) {
      setSaveMessage(error);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, favorite_races: nextRaces } : prev));
  };

  const avatarAccentClass = profile.favorite_format
    ? (isPbFavoriteFormat(profile.favorite_format) ? styles.avatarWrapperPb : styles.avatarWrapperFx)
    : '';

  return (
    <div className={styles.profileHeader}>
      <div className={styles.avatarSection}>
        <div className={`${styles.avatarWrapper} ${avatarAccentClass}`}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarPlaceholder}>
              {profile.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {isOwner && (
          <>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.avatarInput}
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className={styles.avatarUploadBtn}
              disabled={avatarUploading || saving}
              onClick={handleAvatarButtonClick}
            >
              {avatarUploading ? 'Subiendo...' : 'Cambiar foto'}
            </button>
          </>
        )}
      </div>

      <div className={styles.infoSection}>
        <div className={styles.usernameRow}>
          {editingName && isOwner ? (
            <>
              <input
                className={styles.usernameInput}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={50}
              />
              <button type="button" className={styles.saveBtn} onClick={handleSaveUsername}>
                <FaCheck /> Guardar
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setEditingName(false)}
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <>
              <h1 className={styles.username}>{profile.username}</h1>
              {isOwner && (
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => {
                    setNameDraft(profile.username);
                    setEditingName(true);
                  }}
                >
                  <FaEdit /> Editar
                </button>
              )}
            </>
          )}
        </div>

        {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Formato favorito</span>
          {isOwner ? (
            <select
              id="favorite-format"
              className={styles.fieldSelect}
              value={profile.favorite_format ?? ''}
              disabled={saving}
              onChange={(e) => handleFavoriteFormatChange(e.target.value as FavoriteFormatId | '')}
            >
              <option value="">Sin preferencia</option>
              {FAVORITE_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          ) : profile.favorite_format ? (
            <span
              className={`${styles.favoriteFormatBadge} ${
                isPbFavoriteFormat(profile.favorite_format)
                  ? styles.favoriteFormatBadgePb
                  : styles.favoriteFormatBadgeFx
              }`}
            >
              {getFavoriteFormatLabel(profile.favorite_format)}
            </span>
          ) : (
            <span className={styles.readOnlyEmpty}>Sin preferencia</span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Raza favorita por formato</span>
          <div className={styles.raceGrid}>
            {FAVORITE_FORMATS.map((formatOpt) => {
              const isPbFmt = isPbFavoriteFormat(formatOpt.id);
              const raceValue = profile.favorite_races[formatOpt.id];

              if (isOwner) {
                return (
                  <div
                    key={formatOpt.id}
                    className={`${styles.raceCard} ${isPbFmt ? styles.raceCardPb : styles.raceCardFx}`}
                  >
                    <label className={styles.raceCardLabel} htmlFor={`race-${formatOpt.id}`}>
                      {formatOpt.label}
                    </label>
                    <select
                      id={`race-${formatOpt.id}`}
                      className={styles.fieldSelect}
                      value={raceValue ?? ''}
                      disabled={saving}
                      onChange={(e) => handleFavoriteRaceChange(formatOpt.id, e.target.value)}
                    >
                      <option value="">Sin preferencia</option>
                      {racesForFormat(formatOpt.id).map((race) => (
                        <option key={race} value={race}>{race}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div
                  key={formatOpt.id}
                  className={`${styles.raceCard} ${isPbFmt ? styles.raceCardPb : styles.raceCardFx}`}
                >
                  <div className={styles.raceCardLabel}>{formatOpt.label}</div>
                  {raceValue ? (
                    <div className={`${styles.raceCardValue} ${isPbFmt ? styles.raceCardValuePb : styles.raceCardValueFx}`}>
                      {raceValue}
                    </div>
                  ) : (
                    <span className={styles.readOnlyEmpty}>Sin preferencia</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {premierPlayerName && (
          <Link
            to={`/players/${encodeURIComponent(premierPlayerName)}`}
            className={styles.playerLinkBtn}
          >
            <FaChartPie />
            Ver página de jugador
          </Link>
        )}
      </div>
    </div>
  );
}
