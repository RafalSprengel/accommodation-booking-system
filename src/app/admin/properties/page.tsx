import {
  getAllProperties,
  togglePropertyActive,
} from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import AdminShell from '../_components/AdminShell/AdminShell';
import StatusBadge from '../_components/StatusBadge/StatusBadge';
import DeletePropertyButton from "./DeletePropertyButton";
import TogglePropertyButton from "./TogglePropertyButton";
import styles from "./page.module.css";

export default async function PropertiesPage() {
  const properties = await getAllProperties();

  return (
    <AdminShell
      title="Property Management"
      description="Add, edit, or deactivate properties in the system."
    >

      <div className={styles.controls}> 
        <Button href="/admin/properties/add" variant='secondary' className={styles.btnAdd}>
          ➕ Add new property
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No properties found in the system.</p>
          <Button href="/admin/properties/add" variant='secondary' className={styles.btnAdd}>
            Add first property
          </Button>
        </div>
      ) : (
        <div className={styles.propertiesGrid}>
          {properties.map((prop) => (
            <article key={prop._id} className={styles.propertyCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.propertyName}>{prop.name}</h3>
                <StatusBadge
                  text={prop.isActive ? "Active" : "Inactive"}
                  variant={prop.isActive ? "active" : "inactive"}
                />
              </div>
              {prop.description && (
                <p className={styles.description}>{prop.description}</p>
              )}
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. adults:</span>
                  <span className={styles.value}>{prop.maxAdults}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. children (free):</span>
                  <span className={styles.value}>{prop.maxChildren}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Max. extra beds:</span>
                  <span className={styles.value}>{prop.maxExtraBeds}</span>
                </div>
                
              </div>
              <div className={styles.cardActions}>
                <TogglePropertyButton id={prop._id} isActive={prop.isActive} />
                <div className={styles.cardActionsRow}>
                  <Button variant='secondary' href={`/admin/properties/${prop._id}`}>
                    ✏️ Edit
                  </Button>
                  <DeletePropertyButton
                    propertyId={prop._id}
                    propertyName={prop.name}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}